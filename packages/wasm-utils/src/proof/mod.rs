#![allow(clippy::unused_unit)]

use crate::proof::mixer::{MixerProof, MixerProofInput, MixerProofPayload};
use crate::proof::vanchor::{VAnchorProof, VAnchorProofInput, VAnchorProofPayload};
use core::convert::TryFrom;

use ark_bls12_381::Bls12_381;
use ark_bn254::{Bn254, Fr as Bn254Fr};
use ark_ff::{BigInteger, PrimeField};
use arkworks_native_gadgets::merkle_tree::SparseMerkleTree;
use arkworks_native_gadgets::poseidon::Poseidon;
use arkworks_setups::common::{
	setup_keys_unchecked, setup_params, setup_tree_and_create_path, verify_unchecked_raw, Leaf,
};
use arkworks_setups::Curve as ArkCurve;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::__rt::std::collections::btree_map::BTreeMap;
// https://github.com/rustwasm/wasm-bindgen/issues/2231#issuecomment-656293288
use wasm_bindgen::convert::FromWasmAbi;
use wasm_bindgen::prelude::*;

use crate::note::JsNote;
use crate::types::{
	Backend, Curve, Indices, Leaves, NoteProtocol, OpStatusCode, OperationError, Protocol, Uint8Arrayx32, WasmCurve,
};
use crate::utxo::JsUtxo;
use crate::{
	MixerR1CSProverBn254_30, VAnchorR1CSProverBn254_30_16_16_2, VAnchorR1CSProverBn254_30_16_2_2,
	VAnchorR1CSProverBn254_30_2_16_2, VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF, TREE_HEIGHT,
};

pub mod ext_data;
pub mod mixer;
pub mod vanchor;

#[cfg(test)]
mod test;

#[cfg(test)]
mod test_utils;

pub fn truncate_and_pad(t: &[u8]) -> Vec<u8> {
	let mut truncated_bytes = t[..20].to_vec();
	truncated_bytes.extend_from_slice(&[0u8; 12]);
	truncated_bytes
}

#[derive(Debug, Clone)]
pub enum ProofOutput {
	Mixer(MixerProof),
	VAnchor(VAnchorProof),
}

#[derive(Debug, Clone)]
#[wasm_bindgen]
pub struct JsProofOutput {
	#[wasm_bindgen(skip)]
	pub inner: ProofOutput,
}

#[wasm_bindgen]
impl JsProofOutput {
	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name  = OutputProtocol)]
	pub fn output_protocol(&self) -> Protocol {
		let protocol = match self.inner {
			ProofOutput::Mixer(_) => "mixer",
			ProofOutput::VAnchor(_) => "vanchor",
		};

		JsValue::from(protocol).into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = "mixerProof")]
	pub fn mixer_proof(&self) -> Result<MixerProof, OperationError> {
		match self.inner.clone() {
			ProofOutput::Mixer(proof) => Ok(proof),
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
		}
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = vanchorProof)]
	pub fn vanchor_proof(&self) -> Result<VAnchorProof, OperationError> {
		match self.inner.clone() {
			ProofOutput::VAnchor(proof) => Ok(proof),
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
		}
	}
}

pub fn generic_of_jsval<T: FromWasmAbi<Abi = u32>>(js: JsValue, classname: &str) -> Result<T, JsValue> {
	use js_sys::{Object, Reflect};
	let ctor_name = Object::get_prototype_of(&js).constructor().name();
	if ctor_name == classname {
		let ptr = Reflect::get(&js, &JsValue::from_str("ptr"))?;
		let ptr_u32: u32 = ptr.as_f64().ok_or(JsValue::NULL)? as u32;
		let t = unsafe { T::from_abi(ptr_u32) };
		Ok(t)
	} else {
		Err(JsValue::NULL)
	}
}

#[wasm_bindgen]
pub fn js_note_of_jsval(js: JsValue) -> Option<JsNote> {
	generic_of_jsval(js, "JsNote").unwrap_or(None)
}

#[wasm_bindgen]
pub struct LeavesMapInput {
	#[wasm_bindgen(skip)]
	pub leaves: BTreeMap<u64, Vec<Vec<u8>>>,
}

impl Default for LeavesMapInput {
	fn default() -> Self {
		Self::new()
	}
}
#[wasm_bindgen]
impl LeavesMapInput {
	#[wasm_bindgen(constructor)]
	pub fn new() -> LeavesMapInput {
		Self {
			leaves: Default::default(),
		}
	}

	#[wasm_bindgen(js_name=setChainLeaves)]
	pub fn set_chain_leaves(&mut self, chain_id: u64, leaves: Leaves) -> Result<(), JsValue> {
		let leaves: Vec<_> = Array::from(&leaves)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()
			.map_err(|_| OpStatusCode::InvalidLeaves)?
			.into_iter()
			.map(|v| v.0.to_vec())
			.collect();

		self.leaves.insert(chain_id, leaves);

		Ok(())
	}
}

#[derive(Debug, Clone)]
pub enum ProofInput {
	Mixer(Box<MixerProofPayload>),
	VAnchor(Box<VAnchorProofPayload>),
}

impl ProofInput {
	pub fn mixer_input(&self) -> Result<MixerProofPayload, OperationError> {
		match self {
			ProofInput::Mixer(mixer_input) => Ok(*mixer_input.clone()),
			_ => {
				let message = "Can't construct proof input for AnchorProofInput".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNoteProtocol,
					message,
				))
			}
		}
	}

	pub fn vanchor_input(&self) -> Result<VAnchorProofPayload, OperationError> {
		match self {
			ProofInput::VAnchor(vanchor) => Ok(*vanchor.clone()),
			_ => {
				let message = "Can't cant construct proof input for VAnchorProofInput".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNoteProtocol,
					message,
				))
			}
		}
	}
}

#[allow(unused_macros)]
macro_rules! console_log {
	// Note that this is using the `log` function imported above during
	// `bare_bones`
	($($t:tt)*) => (crate::types::log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct JsProofInput {
	#[wasm_bindgen(skip)]
	pub inner: ProofInput,
}
#[derive(Debug, Clone)]
pub enum ProofInputBuilder {
	Mixer(Box<MixerProofInput>),
	VAnchor(Box<VAnchorProofInput>),
}
impl ProofInputBuilder {
	pub fn set_input_utxos(&mut self, utxo_list: Vec<JsUtxo>) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.secret = Some(utxo_list);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	/// Directly set the output Utxos in the proving payload
	pub fn set_output_utxos(&mut self, output_utxos: [JsUtxo; 2]) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.output_utxos = Some(output_utxos);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn roots(&mut self, roots: Vec<Vec<u8>>) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::VAnchor(value) => {
				value.roots = Some(roots);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn public_amount(&mut self, public_amount: i128) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::VAnchor(input) => {
				input.public_amount = Some(public_amount);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn secrets(&mut self, leaf: Leaf) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.secret = Some(leaf.secret_bytes);
				input.nullifier = Some(leaf.nullifier_bytes);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn leaves_map(&mut self, leaves: BTreeMap<u64, Vec<Vec<u8>>>) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.leaves = Some(leaves);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn ext_data_hash(&mut self, ext_data_hash_bytes: Vec<u8>) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.ext_data_hash = Some(ext_data_hash_bytes);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn leaf_indices(&mut self, leaf_indices: Vec<u64>) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.indices = Some(leaf_indices);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn recipient(&mut self, recipient: Vec<u8>) -> Result<(), OperationError> {
		match self {
			Self::Mixer(input) => {
				input.recipient = Some(recipient);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn relayer(&mut self, relayer: Vec<u8>) -> Result<(), OperationError> {
		match self {
			Self::Mixer(input) => {
				input.relayer = Some(relayer);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn leaves_list(&mut self, leaves: Vec<Vec<u8>>) -> Result<(), OperationError> {
		match self {
			Self::Mixer(input) => {
				input.leaves = Some(leaves);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn leaf_index(&mut self, leaf_index: u64) -> Result<(), OperationError> {
		match self {
			Self::Mixer(input) => {
				input.leaf_index = Some(leaf_index);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn fee(&mut self, fee: u128) -> Result<(), OperationError> {
		match self {
			Self::Mixer(input) => {
				input.fee = Some(fee);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn refund(&mut self, refund: u128) -> Result<(), OperationError> {
		match self {
			Self::Mixer(input) => {
				input.refund = Some(refund);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn pk(&mut self, pk: Vec<u8>) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.pk = Some(pk);
			}
			ProofInputBuilder::VAnchor(input) => {
				input.pk = Some(pk);
			}
		}
		Ok(())
	}

	pub fn exponentiation(&mut self, exponentiation: i8) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.exponentiation = Some(exponentiation);
			}
			ProofInputBuilder::VAnchor(input) => {
				input.exponentiation = Some(exponentiation);
			}
		}
		Ok(())
	}

	pub fn width(&mut self, width: usize) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.width = Some(width);
			}
			ProofInputBuilder::VAnchor(input) => {
				input.width = Some(width);
			}
		}
		Ok(())
	}

	pub fn curve(&mut self, curve: Curve) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.curve = Some(curve);
			}
			ProofInputBuilder::VAnchor(input) => {
				input.curve = Some(curve);
			}
		}
		Ok(())
	}

	pub fn backend(&mut self, backend: Backend) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.backend = Some(backend);
			}
			ProofInputBuilder::VAnchor(input) => {
				input.backend = Some(backend);
			}
		}
		Ok(())
	}

	pub fn chain_id(&mut self, chain_id: u128) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.chain_id = Some(chain_id);
			}
			ProofInputBuilder::VAnchor(input) => {
				input.chain_id = Some(chain_id);
			}
		}
		Ok(())
	}
	/* Shared fields  [VAnchor,Anchor,Mixer] */
}
#[wasm_bindgen]
#[derive(Debug)]
pub struct JsProofInputBuilder {
	#[wasm_bindgen(skip)]
	pub inner: ProofInputBuilder,
}
#[wasm_bindgen]
impl JsProofInputBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new(protocol: Protocol) -> Result<JsProofInputBuilder, OperationError> {
		let protocol: String = JsValue::from(&protocol)
			.as_string()
			.ok_or(OpStatusCode::InvalidNoteProtocol)?;
		let note_protocol: NoteProtocol = protocol
			.as_str()
			.parse()
			.map_err(|_| OpStatusCode::InvalidNoteProtocol)?;
		let proof_input_builder = match note_protocol {
			NoteProtocol::Mixer => ProofInputBuilder::Mixer(Default::default()),
			NoteProtocol::VAnchor => ProofInputBuilder::VAnchor(Default::default()),
		};

		Ok(JsProofInputBuilder {
			inner: proof_input_builder,
		})
	}

	#[wasm_bindgen(js_name = setRoots)]
	pub fn set_roots(&mut self, roots: Leaves) -> Result<(), JsValue> {
		let rs: Vec<Vec<u8>> = Array::from(&roots)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()
			.map_err(|_| OpStatusCode::InvalidLeaves)?
			.into_iter()
			.map(|v| v.0.to_vec())
			.collect();
		self.inner.roots(rs)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setRecipient)]
	pub fn set_recipient(&mut self, recipient: JsString) -> Result<(), JsValue> {
		let r: String = recipient.into();
		let recipient = hex::decode(r).map_err(|_| OpStatusCode::InvalidRecipient)?;
		self.inner.recipient(recipient)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setRelayer)]
	pub fn set_relayer(&mut self, relayer: JsString) -> Result<(), JsValue> {
		let r: String = relayer.into();
		let relayer = hex::decode(r).map_err(|_| OpStatusCode::DeserializationFailed)?;
		self.inner.relayer(relayer)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setLeaves)]
	pub fn set_leaves(&mut self, leaves: Leaves) -> Result<(), JsValue> {
		let ls: Vec<_> = Array::from(&leaves)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()
			.map_err(|_| OpStatusCode::InvalidLeaves)?
			.into_iter()
			.map(|v| v.0.to_vec())
			.collect();
		self.inner.leaves_list(ls)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setOutputUtxos)]
	pub fn set_output_utxos(&mut self, utxo1: JsUtxo, utxo2: JsUtxo) -> Result<(), JsValue> {
		self.inner.set_output_utxos([utxo1, utxo2])?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setLeavesMap)]
	pub fn set_leaves_map(&mut self, leaves_input: LeavesMapInput) -> Result<(), JsValue> {
		self.inner.leaves_map(leaves_input.leaves)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setIndices)]
	pub fn set_indices(&mut self, indices: Indices) -> Result<(), JsValue> {
		let indices: Vec<_> = Array::from(&indices)
			.to_vec()
			.into_iter()
			.map(|v| {
				let s: String = JsString::from(v).into();
				s.parse::<u64>()
			})
			.collect::<Result<Vec<u64>, _>>()
			.map_err(|_| OpStatusCode::InvalidIndices)?
			.into_iter()
			.collect();
		self.inner.leaf_indices(indices)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setLeafIndex)]
	pub fn set_leaf_index(&mut self, leaf_index: JsString) -> Result<(), JsValue> {
		let leaf_index: String = leaf_index.into();
		let leaf_index = leaf_index
			.as_str()
			.parse()
			.map_err(|_| OpStatusCode::InvalidLeafIndex)?;
		self.inner.leaf_index(leaf_index)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setFee)]
	pub fn set_fee(&mut self, fee: JsString) -> Result<(), JsValue> {
		let fee: String = fee.into();
		let fee = fee.as_str().parse().map_err(|_| OpStatusCode::InvalidFee)?;
		self.inner.fee(fee)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setRefund)]
	pub fn set_refund(&mut self, refund: JsString) -> Result<(), JsValue> {
		let refund: String = refund.into();
		let refund = refund.as_str().parse().map_err(|_| OpStatusCode::InvalidRefund)?;
		self.inner.refund(refund)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setPk)]
	pub fn set_pk(&mut self, pk: JsString) -> Result<(), JsValue> {
		let p: String = pk.into();
		let proving_key = hex::decode(p).map_err(|_| OpStatusCode::InvalidProvingKey)?;
		self.inner.pk(proving_key)?;
		Ok(())
	}

	#[wasm_bindgen]
	pub fn public_amount(&mut self, public_amount: JsString) -> Result<(), JsValue> {
		let pa: String = public_amount.into();
		let pa: i128 = pa.parse().map_err(|_| OpStatusCode::InvalidPublicAmount)?;
		self.inner.public_amount(pa)?;
		Ok(())
	}

	#[wasm_bindgen]
	pub fn chain_id(&mut self, chain_id: JsString) -> Result<(), JsValue> {
		let chain_id: String = chain_id.into();
		let chain_id = chain_id.parse().map_err(|_| OpStatusCode::InvalidChainId)?;
		self.inner.chain_id(chain_id)?;
		Ok(())
	}

	fn set_meta_data(&mut self, note: &JsNote) -> Result<(), OperationError> {
		let exponentiation = note.exponentiation.unwrap_or(5);
		let backend = note.backend.unwrap_or(Backend::Circom);
		let curve = note.curve.unwrap_or(Curve::Bn254);
		let width = note.width.unwrap_or(3);

		let chain_id = note
			.target_chain_id
			.parse()
			.map_err(|_| OpStatusCode::InvalidTargetChain)?;

		self.inner.exponentiation(exponentiation)?;
		self.inner.backend(backend)?;
		self.inner.width(width)?;
		self.inner.curve(curve)?;
		self.inner.chain_id(chain_id)?;
		Ok(())
	}

	#[wasm_bindgen(js_name = setNote)]
	pub fn set_metadata_from_note(&mut self, note: &JsNote) -> Result<(), JsValue> {
		// For the Mixer/Anchor secrets live in the the note
		// For the VAnchor there is a call `set_notes` that will set UTXOs in the
		// `ProofInput::VAnchor(VAnchorProofInput)`
		match self.inner {
			ProofInputBuilder::Mixer(_) => self.set_meta_data(note)?,
			_ => return Err(OpStatusCode::InvalidNoteProtocol.into()),
		}

		#[allow(clippy::single_match)]
		match self.inner {
			ProofInputBuilder::Mixer(_) => {
				let leaf = note.get_leaf_and_nullifier()?;
				let mixer_leaf = leaf.mixer_leaf()?;
				self.inner.secrets(mixer_leaf)?
			}
			_ => {}
		}
		Ok(())
	}

	#[wasm_bindgen]
	pub fn build_js(self) -> Result<JsProofInput, JsValue> {
		let proof_input = self.build()?;
		Ok(JsProofInput { inner: proof_input })
	}

	/// Set notes for VAnchor
	#[wasm_bindgen(js_name=setNotes)]
	pub fn set_notes(&mut self, notes: Array) -> Result<(), JsValue> {
		let notes: Vec<JsNote> = notes
			.iter()
			.map(|v| js_note_of_jsval(v).ok_or(OpStatusCode::InvalidNoteSecrets))
			.collect::<Result<Vec<JsNote>, _>>()?;
		self.set_meta_data(&notes[0])?;
		let utxos = notes.iter().map(|n| n.get_js_utxo()).collect::<Result<Vec<_>, _>>()?;

		self.inner.set_input_utxos(utxos)?;
		Ok(())
	}

	#[wasm_bindgen(js_name=setExtDatahash)]
	pub fn set_ext_data_hash(&mut self, ex_data_hash: JsString) -> Result<(), JsValue> {
		let ex_data_hash: String = ex_data_hash.into();
		let bytes = hex::decode(&ex_data_hash).map_err(|_| OpStatusCode::InvalidExtDataHash)?;

		self.inner.ext_data_hash(bytes)?;
		Ok(())
	}
}
impl JsProofInputBuilder {
	pub fn build(self) -> Result<ProofInput, OperationError> {
		let proof_input = match self.inner {
			ProofInputBuilder::Mixer(mixer_proof_input) => {
				let mixer_payload = mixer_proof_input.build()?;
				ProofInput::Mixer(Box::new(mixer_payload))
			}
			ProofInputBuilder::VAnchor(vanchor_proof_input) => {
				let vanchor_payload = vanchor_proof_input.build()?;
				ProofInput::VAnchor(Box::new(vanchor_payload))
			}
		};
		Ok(proof_input)
	}
}

#[wasm_bindgen]
pub struct MTBn254X5 {
	#[wasm_bindgen(skip)]
	pub inner: SparseMerkleTree<Bn254Fr, Poseidon<Bn254Fr>, TREE_HEIGHT>,
}

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
impl MTBn254X5 {
	#[wasm_bindgen(constructor)]
	pub fn new(initial_leaves: Leaves, leaf_index: JsString) -> Result<MTBn254X5, JsValue> {
		let leaf_index: String = leaf_index.into();
		let leaf_index: u64 = leaf_index.parse().expect("Failed to parse the leaf index");
		let leaves: Vec<_> = Array::from(&initial_leaves)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()
			.map_err(|_| OpStatusCode::InvalidLeaves)?
			.into_iter()
			.map(|v| Bn254Fr::from_be_bytes_mod_order(v.0.as_ref()))
			.collect();

		let curve = ArkCurve::Bn254;
		let params3 = setup_params::<Bn254Fr>(curve, 5, 3);
		let poseidon3 = Poseidon::new(params3);

		let (tree, _) = setup_tree_and_create_path::<Bn254Fr, Poseidon<Bn254Fr>, TREE_HEIGHT>(
			&poseidon3,
			&leaves,
			leaf_index,
			&DEFAULT_LEAF,
		)
		.unwrap();
		Ok(Self { inner: tree })
	}

	#[wasm_bindgen(getter)]
	pub fn root(&self) -> JsString {
		let root = self.inner.root().into_repr().to_bytes_be().to_vec();
		JsString::from(hex::encode(root))
	}

	#[wasm_bindgen]
	pub fn insert(&mut self, leaves: Leaves) -> Result<(), JsValue> {
		let mut leaves_bt = BTreeMap::<_, Bn254Fr>::new();
		Array::from(&leaves)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()
			.map_err(|_| OpStatusCode::InvalidLeaves)?
			.iter()
			.for_each(|leaf| {
				leaves_bt
					.insert(
						leaves_bt.len() as u32 + 1_u32,
						Bn254Fr::from_be_bytes_mod_order(leaf.0.as_ref()),
					)
					.unwrap();
			});

		let params3 = setup_params::<Bn254Fr>(ArkCurve::Bn254, 5, 3);
		let poseidon3 = Poseidon::new(params3);
		self.inner
			.insert_batch(&leaves_bt, &poseidon3)
			.map_err(|_| OpStatusCode::InvalidLeaves)?;
		Ok(())
	}
}
// For testing on js side
#[wasm_bindgen]
pub fn verify_js_proof(proof: JsString, public_inputs: Array, vk: JsString, curve: WasmCurve) -> bool {
	let proof = hex::decode(JsValue::from(proof).as_string().unwrap()).unwrap();
	let pub_ins: Vec<Vec<u8>> = public_inputs
		.to_vec()
		.into_iter()
		.map(|v| JsValue::from(JsString::from(v)).as_string().unwrap())
		.map(|x| hex::decode(&x).unwrap())
		.collect();

	let curve: Curve = JsValue::from(curve).as_string().unwrap().parse().unwrap();
	let vk = hex::decode(JsValue::from(vk).as_string().unwrap()).unwrap();
	match curve {
		Curve::Bls381 => verify_unchecked_raw::<Bls12_381>(&pub_ins, &vk, &proof).unwrap(),
		Curve::Bn254 => verify_unchecked_raw::<Bn254>(&pub_ins, &vk, &proof).unwrap(),
	}
}

#[wasm_bindgen]
pub struct JsProvingKeys {
	#[wasm_bindgen(skip)]
	pub pk: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub vk: Vec<u8>,
}
#[wasm_bindgen]
impl JsProvingKeys {
	#[wasm_bindgen(getter)]
	pub fn pk(&self) -> Uint8Array {
		Uint8Array::from(self.pk.as_slice())
	}

	#[wasm_bindgen(getter)]
	pub fn vk(&self) -> Uint8Array {
		Uint8Array::from(self.pk.as_slice())
	}
}
#[wasm_bindgen(js_name = setupKeys)]
pub fn setup_keys(
	protocol: Protocol,
	curve: Option<WasmCurve>,
	anchor_count: Option<u32>,
	in_count: Option<u32>,
	out_count: Option<u32>,
) -> Result<JsProvingKeys, JsValue> {
	let curve: Curve = match curve {
		Some(curve) => JsValue::from(curve).as_string().unwrap().parse().unwrap(),
		None => Curve::Bn254,
	};
	let anchor_count = anchor_count.unwrap_or(2);
	let in_count = in_count.unwrap_or(2);
	let out_count = out_count.unwrap_or(2);
	let note_protocol: NoteProtocol = JsValue::from(protocol).as_string().unwrap().parse().unwrap();
	let (pk, vk) = match (note_protocol, curve, anchor_count, in_count, out_count) {
		(NoteProtocol::Mixer, ..) => {
			let (c, ..) = MixerR1CSProverBn254_30::setup_random_circuit(ArkCurve::Bn254, DEFAULT_LEAF, &mut OsRng)
				.expect("Failed to create a circuit");
			let (pk, vk) = setup_keys_unchecked::<Bn254, _, _>(c, &mut OsRng).expect("failed to generate keys");
			(pk, vk)
		}
		(NoteProtocol::VAnchor, Curve::Bn254, 2, 2, 2) => {
			let c = VAnchorR1CSProverBn254_30_2_2_2::setup_random_circuit(ArkCurve::Bn254, DEFAULT_LEAF, &mut OsRng)
				.expect("Failed to create a circuit");
			let (pk, vk) = setup_keys_unchecked::<Bn254, _, _>(c, &mut OsRng).expect("failed to generate keys");
			(pk, vk)
		}
		(NoteProtocol::VAnchor, Curve::Bn254, 2, 16, 2) => {
			let c = VAnchorR1CSProverBn254_30_2_16_2::setup_random_circuit(ArkCurve::Bn254, DEFAULT_LEAF, &mut OsRng)
				.expect("Failed to create a circuit");
			let (pk, vk) = setup_keys_unchecked::<Bn254, _, _>(c, &mut OsRng).expect("failed to generate keys");
			(pk, vk)
		}
		(NoteProtocol::VAnchor, Curve::Bn254, 16, 2, 2) => {
			let c = VAnchorR1CSProverBn254_30_16_2_2::setup_random_circuit(ArkCurve::Bn254, DEFAULT_LEAF, &mut OsRng)
				.expect("Failed to create a circuit");
			let (pk, vk) = setup_keys_unchecked::<Bn254, _, _>(c, &mut OsRng).expect("failed to generate keys");
			(pk, vk)
		}
		(NoteProtocol::VAnchor, Curve::Bn254, 16, 16, 2) => {
			let c = VAnchorR1CSProverBn254_30_16_16_2::setup_random_circuit(ArkCurve::Bn254, DEFAULT_LEAF, &mut OsRng)
				.expect("Failed to create a circuit");
			let (pk, vk) = setup_keys_unchecked::<Bn254, _, _>(c, &mut OsRng).expect("failed to generate keys");
			(pk, vk)
		}
		_ => return Err(JsValue::from(JsString::from("Unsupported input"))),
	};
	Ok(JsProvingKeys { pk, vk })
}
#[wasm_bindgen]
pub fn generate_proof_js(proof_input: JsProofInput) -> Result<JsProofOutput, JsValue> {
	let mut rng = OsRng;
	let proof_input_value = proof_input.inner;
	match proof_input_value {
		ProofInput::Mixer(mixer_proof_input) => {
			mixer::create_proof(*mixer_proof_input, &mut rng).map(|v| JsProofOutput {
				inner: ProofOutput::Mixer(v),
			})
		}
		ProofInput::VAnchor(vanchor_proof_input) => {
			vanchor::create_proof(*vanchor_proof_input, &mut rng).map(|v| JsProofOutput {
				inner: ProofOutput::VAnchor(v),
			})
		}
	}
	.map_err(|e| e.into())
}
