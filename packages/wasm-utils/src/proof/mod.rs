#![allow(clippy::unused_unit)]

use core::convert::{TryFrom, TryInto};

use ark_bls12_381::Bls12_381;
use ark_bn254::{Bn254, Fr as Bn254Fr};
use ark_ff::{BigInteger, PrimeField};
use arkworks_native_gadgets::merkle_tree::SparseMerkleTree;
use arkworks_native_gadgets::poseidon::Poseidon;
use arkworks_setups::common::{setup_params, setup_tree_and_create_path, verify_unchecked_raw, Leaf};
use arkworks_setups::Curve as ArkCurve;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::__rt::std::collections::btree_map::BTreeMap;
// https://github.com/rustwasm/wasm-bindgen/issues/2231#issuecomment-656293288
use wasm_bindgen::convert::FromWasmAbi;
use wasm_bindgen::prelude::*;

use crate::note::{JsLeafInner, JsNote};
use crate::types::{
	Backend, Curve, Indices, Leaves, NoteProtocol, OpStatusCode, OperationError, Protocol, Uint8Arrayx32, WasmCurve,
};
use crate::utxo::JsUtxo;
use crate::TREE_HEIGHT;

mod anchor;
mod mixer;
#[cfg(test)]
mod test_utils;
mod vanchor;

pub fn truncate_and_pad(t: &[u8]) -> Vec<u8> {
	let mut truncated_bytes = t[..20].to_vec();
	truncated_bytes.extend_from_slice(&[0u8; 12]);
	truncated_bytes
}

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
#[derive(Debug)]
pub struct Proof {
	#[wasm_bindgen(skip)]
	pub proof: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub nullifier_hash: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub root: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub roots: Vec<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub public_inputs: Vec<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub leaf: Vec<u8>,
}

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
impl Proof {
	#[wasm_bindgen(getter)]
	pub fn proof(&self) -> JsString {
		let proof_bytes = hex::encode(&self.proof);
		proof_bytes.into()
	}

	#[wasm_bindgen(js_name = nullifierHash)]
	#[wasm_bindgen(getter)]
	pub fn nullifier_hash(&self) -> JsString {
		let nullifier_bytes = hex::encode(&self.nullifier_hash);
		nullifier_bytes.into()
	}

	#[wasm_bindgen(getter)]
	pub fn root(&self) -> JsString {
		let root = hex::encode(&self.root);
		root.into()
	}

	#[wasm_bindgen(getter)]
	pub fn roots(&self) -> Array {
		let roots: Array = self.roots.iter().map(|i| JsString::from(hex::encode(i))).collect();
		roots
	}
}

#[derive(Debug, Clone)]
pub struct MixerProofPayload {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub secret: Vec<u8>,
	pub nullifier: Vec<u8>,
	pub recipient: Vec<u8>,
	pub relayer: Vec<u8>,
	pub pk: Vec<u8>,
	pub refund: u128,
	pub fee: u128,
	pub chain_id: u128,
	pub leaves: Vec<Vec<u8>>,
	pub leaf_index: u64,
}

#[derive(Debug, Clone, Default)]
pub struct MixerProofInput {
	pub exponentiation: Option<i8>,
	pub width: Option<usize>,
	pub curve: Option<Curve>,
	pub backend: Option<Backend>,
	pub secret: Option<Vec<u8>>,
	pub nullifier: Option<Vec<u8>>,
	pub recipient: Option<Vec<u8>>,
	pub relayer: Option<Vec<u8>>,
	pub pk: Option<Vec<u8>>,
	pub refund: Option<u128>,
	pub fee: Option<u128>,
	pub chain_id: Option<u128>,
	pub leaves: Option<Vec<Vec<u8>>>,
	pub leaf_index: Option<u64>,
}

impl MixerProofInput {
	pub fn build(self) -> Result<MixerProofPayload, OperationError> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let recipient = self.recipient.ok_or(OpStatusCode::InvalidRecipient)?;
		let relayer = self.relayer.ok_or(OpStatusCode::InvalidRelayer)?;
		let leaf_index = self.leaf_index.ok_or(OpStatusCode::InvalidLeafIndex)?;
		let secret = self.secret.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let nullifier = self.nullifier.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;
		let fee = self.fee.ok_or(OpStatusCode::InvalidFee)?;
		let refund = self.refund.ok_or(OpStatusCode::InvalidRefund)?;

		let exponentiation = self.exponentiation.unwrap_or(5);
		let width = self.width.unwrap_or(3);
		let curve = self.curve.unwrap_or(Curve::Bn254);
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		let processed_relayer = truncate_and_pad(&relayer);
		let processed_recipient = truncate_and_pad(&recipient);

		Ok(MixerProofPayload {
			exponentiation,
			width,
			curve,
			backend,
			secret,
			nullifier,
			recipient: processed_recipient,
			relayer: processed_relayer,
			pk,
			refund,
			fee,
			chain_id: 0,
			leaves,
			leaf_index,
		})
	}
}
#[derive(Debug, Clone)]
pub struct AnchorProofPayload {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub secret: Vec<u8>,
	pub nullifier: Vec<u8>,
	pub recipient: Vec<u8>,
	pub relayer: Vec<u8>,
	pub pk: Vec<u8>,
	pub refund: u128,
	pub fee: u128,
	pub chain_id: u64,
	pub leaves: Vec<Vec<u8>>,
	pub leaf_index: u64,
	/// get roots for linkable tree
	pub roots: Vec<Vec<u8>>,
	/// EMPTY commitment if withdrawing [0u8;32]
	/// not EMPTY if refreshing
	pub refresh_commitment: [u8; 32],
}

#[derive(Debug, Clone, Default)]
pub struct AnchorProofInput {
	pub exponentiation: Option<i8>,
	pub width: Option<usize>,
	pub curve: Option<Curve>,
	pub backend: Option<Backend>,
	pub secret: Option<Vec<u8>>,
	pub nullifier: Option<Vec<u8>>,
	pub recipient: Option<Vec<u8>>,
	pub relayer: Option<Vec<u8>>,
	pub pk: Option<Vec<u8>>,
	pub refund: Option<u128>,
	pub fee: Option<u128>,
	pub chain_id: Option<u64>,
	pub leaves: Option<Vec<Vec<u8>>>,
	pub leaf_index: Option<u64>,
	/// get roots for linkable tree
	pub roots: Option<Vec<Vec<u8>>>,
	/// EMPTY commitment if withdrawing [0u8;32]
	/// not EMPTY if refreshing
	pub refresh_commitment: Option<[u8; 32]>,
}
impl AnchorProofInput {
	pub fn build(self) -> Result<AnchorProofPayload, OperationError> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let recipient = self.recipient.ok_or(OpStatusCode::InvalidRecipient)?;
		let relayer = self.relayer.ok_or(OpStatusCode::InvalidRelayer)?;
		let leaf_index = self.leaf_index.ok_or(OpStatusCode::InvalidLeafIndex)?;
		let secret = self.secret.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let nullifier = self.nullifier.ok_or(OpStatusCode::InvalidNullifer)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;
		let fee = self.fee.ok_or(OpStatusCode::InvalidFee)?;
		let refund = self.refund.ok_or(OpStatusCode::InvalidRefund)?;
		let refresh_commitment = self.refresh_commitment.ok_or(OpStatusCode::InvalidLeaves)?;
		let roots = self.roots.ok_or(OpStatusCode::InvalidLeaves)?;
		let chain_id = self.chain_id.ok_or(OpStatusCode::InvalidTargetChain)?;

		let exponentiation = self.exponentiation.unwrap_or(5);
		let width = self.width.unwrap_or(3);
		let curve = self.curve.unwrap_or(Curve::Bn254);
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		let processed_relayer = truncate_and_pad(&relayer);
		let processed_recipient = truncate_and_pad(&recipient);

		Ok(AnchorProofPayload {
			exponentiation,
			width,
			curve,
			backend,
			secret,
			nullifier,
			recipient: processed_recipient,
			relayer: processed_relayer,
			pk,
			refund,
			fee,
			chain_id,
			leaves,
			leaf_index,
			roots,
			refresh_commitment,
		})
	}
}

#[derive(Debug, Clone)]
pub struct VAnchorProofPayload {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub pk: Vec<u8>,
	pub leaves: BTreeMap<u64, Vec<Vec<u8>>>,
	pub leaves_vec: Vec<Vec<Vec<u8>>>,
	/// get roots for linkable tree
	/// Available set can be of length 2 , 16 , 32
	pub roots: Vec<Vec<u8>>,
	// Notes for UTXOs
	pub secret: Vec<JsUtxo>,
	// Leaf indices
	pub indices: Vec<u64>,
	// Chain Id
	pub chain_id: u64,
	// Public amount
	pub public_amount: i128,
	// utxo config
	pub output_config: [OutputUtxoConfig; 2],
}
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OutputUtxoConfig {
	#[wasm_bindgen(skip)]
	pub amount: u128,
	#[wasm_bindgen(skip)]
	pub index: Option<u64>,
	#[wasm_bindgen(skip)]
	pub chain_id: u64,
}

#[wasm_bindgen]
impl OutputUtxoConfig {
	#[wasm_bindgen(constructor)]
	pub fn new(amount: JsString, index: Option<u64>, chain_id: u64) -> Result<OutputUtxoConfig, JsValue> {
		let amount: String = amount.into();

		let amount = amount.parse().map_err(|_| OpStatusCode::InvalidAmount)?;

		Ok(OutputUtxoConfig {
			amount,
			index,
			chain_id,
		})
	}
}
#[derive(Debug, Clone, Default)]
pub struct VAnchorProofInput {
	pub exponentiation: Option<i8>,
	pub width: Option<usize>,
	pub curve: Option<Curve>,
	pub backend: Option<Backend>,
	pub pk: Option<Vec<u8>>,
	pub leaves: Option<BTreeMap<u64, Vec<Vec<u8>>>>,
	pub leaves_vec: Option<Vec<Vec<Vec<u8>>>>,
	/// get roots for linkable tree
	/// Available set can be of length 2 , 16 , 32
	pub roots: Option<Vec<Vec<u8>>>,
	// Notes for UTXOs
	pub secret: Option<Vec<JsUtxo>>,
	// Leaf indices
	pub indices: Option<Vec<u64>>,
	// Chain Id
	pub chain_id: Option<u128>,
	// Public amount
	pub public_amount: Option<i128>,
	// ouput utxos
	pub output_config: Option<[OutputUtxoConfig; 2]>,
}

pub fn generic_of_jsval<T: FromWasmAbi<Abi = u32>>(js: JsValue, classname: &str) -> Result<T, JsValue> {
	use js_sys::{Object, Reflect};
	let ctor_name = Object::get_prototype_of(&js).constructor().name();
	if ctor_name == classname {
		let ptr = Reflect::get(&js, &JsValue::from_str("ptr"))?;
		let ptr_u32: u32 = ptr.as_f64().ok_or(JsValue::NULL)? as u32;
		let foo = unsafe { T::from_abi(ptr_u32) };
		Ok(foo)
	} else {
		Err(JsValue::NULL)
	}
}

#[wasm_bindgen]
pub fn jsNote_of_jsval(js: JsValue) -> Option<JsNote> {
	generic_of_jsval(js, "JsNote").unwrap_or(None)
}

#[wasm_bindgen]
pub struct LeavesMapInput {
	#[wasm_bindgen(skip)]
	pub leaves: BTreeMap<u64, Vec<Vec<u8>>>,
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

impl VAnchorProofInput {
	pub fn build(self) -> Result<VAnchorProofPayload, OperationError> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let secret = self.secret.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;
		// TODO add error
		let roots = self.roots.ok_or(OpStatusCode::InvalidRoots)?;
		let chain_id = self.chain_id.ok_or(OpStatusCode::InvalidChainId)?;
		let indices = self.indices.ok_or(OpStatusCode::InvalidIndices)?;
		let public_amount = self.public_amount.ok_or(OpStatusCode::InvalidPublicAmount)?;
		let output_config = self.output_config.ok_or(OpStatusCode::InvalidPublicAmount)?;

		let exponentiation = self.exponentiation.unwrap_or(5);
		let width = self.width.unwrap_or(3);
		let curve = self.curve.unwrap_or(Curve::Bn254);
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		Ok(VAnchorProofPayload {
			exponentiation,
			width,
			curve,
			backend,
			pk,
			leaves,
			leaves_vec: self.leaves_vec.unwrap_or_default(),
			roots,
			secret,
			indices,
			chain_id: chain_id.try_into().unwrap(),
			public_amount,
			output_config,
		})
	}
}

#[derive(Debug, Clone)]
pub enum ProofInput {
	Mixer(MixerProofPayload),
	Anchor(AnchorProofPayload),
	VAnchor(VAnchorProofPayload),
}

impl ProofInput {
	pub fn mixer_input(&self) -> Result<MixerProofPayload, OperationError> {
		match self {
			ProofInput::Mixer(mixer_input) => Ok(mixer_input.clone()),
			_ => {
				let message = "Can't construct proof input for AnchorProofInput".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNoteProtocol,
					message,
				))
			}
		}
	}

	pub fn anchor_input(&self) -> Result<AnchorProofPayload, OperationError> {
		match self {
			ProofInput::Anchor(anchor) => Ok(anchor.clone()),
			_ => {
				let message = "Can't cant construct proof input for MixerProofInput ".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNoteProtocol,
					message,
				))
			}
		}
	}

	pub fn vanchor_input(&self) -> Result<VAnchorProofPayload, OperationError> {
		match self {
			ProofInput::VAnchor(vanchor) => Ok(vanchor.clone()),
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
	Mixer(MixerProofInput),
	Anchor(AnchorProofInput),
	VAnchor(VAnchorProofInput),
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

	pub fn set_output_config(&mut self, output_config: [OutputUtxoConfig; 2]) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.output_config = Some(output_config);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn roots(&mut self, roots: Vec<Vec<u8>>) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Anchor(value) => {
				value.roots = Some(roots);
				Ok(())
			}
			ProofInputBuilder::VAnchor(value) => {
				value.roots = Some(roots);
				Ok(())
			}
			_ => return Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn refresh_commitment(&mut self, comittment: [u8; 32]) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Anchor(input) => {
				input.refresh_commitment = Some(comittment);
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
			ProofInputBuilder::Anchor(input) => {
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

	pub fn leaves_vec(&mut self, leaves: Vec<Vec<Vec<u8>>>) -> Result<(), OperationError> {
		match self {
			Self::VAnchor(input) => {
				input.leaves_vec = Some(leaves);
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

	/* Shared fields  [Anchor,Mixer] */
	pub fn recipient(&mut self, recipient: Vec<u8>) -> Result<(), OperationError> {
		match self {
			Self::Anchor(input) => {
				input.recipient = Some(recipient);
				Ok(())
			}
			Self::Mixer(input) => {
				input.recipient = Some(recipient);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn relayer(&mut self, relayer: Vec<u8>) -> Result<(), OperationError> {
		match self {
			Self::Anchor(input) => {
				input.relayer = Some(relayer);
				Ok(())
			}
			Self::Mixer(input) => {
				input.relayer = Some(relayer);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn leaves_list(&mut self, leaves: Vec<Vec<u8>>) -> Result<(), OperationError> {
		match self {
			Self::Anchor(input) => {
				input.leaves = Some(leaves);
				Ok(())
			}
			Self::Mixer(input) => {
				input.leaves = Some(leaves);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn leaf_index(&mut self, leaf_index: u64) -> Result<(), OperationError> {
		match self {
			Self::Anchor(input) => {
				input.leaf_index = Some(leaf_index);
				Ok(())
			}
			Self::Mixer(input) => {
				input.leaf_index = Some(leaf_index);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn fee(&mut self, fee: u128) -> Result<(), OperationError> {
		match self {
			Self::Anchor(input) => {
				input.fee = Some(fee);
				Ok(())
			}
			Self::Mixer(input) => {
				input.fee = Some(fee);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	pub fn refund(&mut self, refund: u128) -> Result<(), OperationError> {
		match self {
			Self::Anchor(input) => {
				input.refund = Some(refund);
				Ok(())
			}
			Self::Mixer(input) => {
				input.refund = Some(refund);
				Ok(())
			}
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
		}
	}

	/* Shared fields  [Anchor,Mixer] */

	/* Shared fields  [VAnchor,Anchor,Mixer] */
	pub fn pk(&mut self, pk: Vec<u8>) -> Result<(), OperationError> {
		match self {
			ProofInputBuilder::Mixer(input) => {
				input.pk = Some(pk);
			}
			ProofInputBuilder::Anchor(input) => {
				input.pk = Some(pk.into());
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
			ProofInputBuilder::Anchor(input) => {
				input.exponentiation = Some(exponentiation.into());
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
			ProofInputBuilder::Anchor(input) => {
				input.width = Some(width.into());
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
			ProofInputBuilder::Anchor(input) => {
				input.curve = Some(curve.into());
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
			ProofInputBuilder::Anchor(input) => {
				input.backend = Some(backend.into());
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
			ProofInputBuilder::Anchor(input) => {
				input.chain_id = Some(chain_id.try_into().map_err(|_| OpStatusCode::InvalidTargetChain)?);
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
			NoteProtocol::Anchor => ProofInputBuilder::Anchor(Default::default()),
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

	#[wasm_bindgen(js_name = setRefreshCommitment)]
	pub fn set_refresh_commitment(&mut self, refresh_commitment: JsString) -> Result<(), JsValue> {
		let c: String = refresh_commitment.into();
		let refresh_commitment = hex::decode(c).map_err(|_| OpStatusCode::CommitmentNotSet)?;
		let refresh_commitment: [u8; 32] = refresh_commitment
			.try_into()
			.map_err(|_| OpStatusCode::CommitmentNotSet)?;
		self.inner.refresh_commitment(refresh_commitment)?;
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

	#[wasm_bindgen(js_name = setVanchorOutputConfig)]
	pub fn set_vanchor_output_config(
		&mut self,
		utxo1: OutputUtxoConfig,
		utxo2: OutputUtxoConfig,
	) -> Result<(), JsValue> {
		self.inner.set_output_config([utxo1, utxo2])?;
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
		self.inner.public_amount(pa);
		Ok(())
	}

	#[wasm_bindgen]
	pub fn chain_id(&mut self, chain_id: JsString) -> Result<(), JsValue> {
		let chain_id: String = chain_id.into();
		let chain_id = chain_id.parse().map_err(|_| OpStatusCode::InvalidChainId)?;
		self.inner.chain_id(chain_id);
		Ok(())
	}

	#[wasm_bindgen(js_name = setNote)]
	pub fn set_metadata_from_note(&mut self, note: &JsNote) -> Result<(), JsValue> {
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
		// For the Mixer/Anchor secrets live in the the note
		// For the VAnchor there is a call `set_notes` that will set UTXOs in the
		// `ProofInput::VAnchor(VAnchorProofInput)`
		match self.inner {
			ProofInputBuilder::Mixer(_) => {
				let leaf = note.get_leaf_and_nullifier()?;
				let mixer_leaf = leaf.mixer_leaf()?;
				self.inner.secrets(mixer_leaf)?
			}
			ProofInputBuilder::Anchor(_) => {
				let leaf = note.get_leaf_and_nullifier()?;
				let anchor_leaf = leaf.anchor_leaf()?;
				self.inner.secrets(anchor_leaf)?
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
		let utxos: Vec<_> = notes
			.to_vec()
			.into_iter()
			.map(|v| {
				jsNote_of_jsval(v)
					.ok_or(OpStatusCode::InvalidNoteSecrets)
					.map(|n| n.get_js_utxo())?
			})
			.collect::<Result<Vec<_>, _>>()?;

		self.inner.set_input_utxos(utxos)?;
		Ok(())
	}
}
impl JsProofInputBuilder {
	pub fn build(self) -> Result<ProofInput, OperationError> {
		let proof_input = match self.inner {
			ProofInputBuilder::Mixer(mixer_proof_input) => {
				let mixer_payload = mixer_proof_input.build()?;
				ProofInput::Mixer(mixer_payload)
			}
			ProofInputBuilder::Anchor(anchor_proof_input) => {
				let anchor_payload = anchor_proof_input.build()?;
				ProofInput::Anchor(anchor_payload)
			}
			ProofInputBuilder::VAnchor(vanchor_proof_input) => {
				let vanchor_payload = vanchor_proof_input.build()?;
				ProofInput::VAnchor(vanchor_payload)
			}
		};
		Ok(proof_input)
	}
}

#[wasm_bindgen]
pub struct AnchorMTBn254X5 {
	#[wasm_bindgen(skip)]
	pub inner: SparseMerkleTree<Bn254Fr, Poseidon<Bn254Fr>, TREE_HEIGHT>,
}

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
impl AnchorMTBn254X5 {
	#[wasm_bindgen(constructor)]
	pub fn new(initial_leaves: Leaves, leaf_index: JsString) -> Result<AnchorMTBn254X5, JsValue> {
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
			.map(|v| Bn254Fr::from_le_bytes_mod_order(v.0.as_ref()))
			.collect();

		let curve = ArkCurve::Bn254;
		let params3 = setup_params::<Bn254Fr>(curve, 5, 3);
		let poseidon3 = Poseidon::new(params3);

		let (tree, _) = setup_tree_and_create_path::<Bn254Fr, Poseidon<Bn254Fr>, TREE_HEIGHT>(
			&poseidon3, &leaves, leaf_index, &[0u8; 32],
		)
		.unwrap();
		Ok(Self { inner: tree })
	}

	#[wasm_bindgen(getter)]
	pub fn root(&self) -> JsString {
		let root = self.inner.root().into_repr().to_bytes_le().to_vec();
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
						Bn254Fr::from_le_bytes_mod_order(leaf.0.as_ref()),
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

#[wasm_bindgen]
pub fn generate_proof_js(proof_input: JsProofInput) -> Result<Proof, JsValue> {
	let mut rng = OsRng;
	let proof_input_value = proof_input.inner;
	match proof_input_value {
		ProofInput::Mixer(mixer_proof_input) => mixer::create_proof(mixer_proof_input, &mut rng),
		ProofInput::Anchor(anchor_proof_input) => anchor::create_proof(anchor_proof_input, &mut rng),
		ProofInput::VAnchor(vanchor_proof_input) => vanchor::create_proof(vanchor_proof_input, &mut rng),
	}
	.map_err(|e| e.into())
}

#[wasm_bindgen]
pub fn validate_proof(proof: &Proof, vk: JsString, curve: WasmCurve) -> Result<bool, JsValue> {
	let vk_string: String = vk.into();
	let curve: String = JsValue::from(&curve).as_string().ok_or(OpStatusCode::InvalidCurve)?;
	let curve: Curve = curve.parse().map_err(|_| OpStatusCode::InvalidCurve)?;

	let vk = hex::decode(vk_string).expect("Field to deserialize");
	let is_valid = match curve {
		Curve::Bls381 => verify_unchecked_raw::<Bls12_381>(&proof.public_inputs, &vk, &proof.proof),
		Curve::Bn254 => verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof),
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::InvalidProof, e.to_string()))?;

	Ok(is_valid)
}
#[cfg(test)]
mod test {
	use crate::{VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF};
	use ark_std::UniformRand;
	use arkworks_setups::common::{prove, prove_unchecked, setup_keys, setup_keys_unchecked, verify};
	use wasm_bindgen_test::*;

	use crate::proof::test_utils::{
		generate_anchor_test_setup, generate_mixer_test_setup, generate_vanchor_test_rust_setup,
		generate_vanchor_test_setup, AnchorTestSetup, MixerTestSetup, VAnchorTestSetup, ANCHOR_NOTE_V1_X5_4,
		ANCHOR_NOTE_V2_X5_4, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5, VANCHOR_NOTE_V2_X5_4,
	};

	use super::*;

	const TREE_DEPTH: usize = 30;

	#[wasm_bindgen_test]
	fn mixer_js_setup() {
		let MixerTestSetup {
			relayer,
			recipient,
			proof_input_builder,
			leaf_bytes,
			..
		} = generate_mixer_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5);

		let truncated_substrate_relayer_address = truncate_and_pad(&relayer);
		let truncated_substrate_recipient_address = truncate_and_pad(&recipient);

		let proof_input = proof_input_builder.build().unwrap();
		let mixer_input = proof_input.mixer_input().unwrap();

		assert_eq!(
			hex::encode(mixer_input.recipient),
			hex::encode(&truncated_substrate_recipient_address)
		);
		assert_eq!(
			hex::encode(mixer_input.relayer),
			hex::encode(&truncated_substrate_relayer_address)
		);

		assert_eq!(mixer_input.refund, 1);
		assert_eq!(mixer_input.fee, 5);

		assert_eq!(mixer_input.leaf_index, 0);
		assert_eq!(hex::encode(&mixer_input.leaves[0]), hex::encode(leaf_bytes));
	}

	#[wasm_bindgen_test]
	fn anchor_js_setup() {
		let AnchorTestSetup {
			relayer,
			recipient,
			proof_input_builder,
			roots_raw,
			leaf_bytes,
			..
		} = generate_anchor_test_setup(
			DECODED_SUBSTRATE_ADDRESS,
			DECODED_SUBSTRATE_ADDRESS,
			ANCHOR_NOTE_V1_X5_4,
		);
		let anchor_input = proof_input_builder.build().unwrap().anchor_input().unwrap();
		let truncated_substrate_relayer_address = truncate_and_pad(&relayer);
		let truncated_substrate_recipient_address = truncate_and_pad(&recipient);
		assert_eq!(
			hex::encode(anchor_input.recipient),
			hex::encode(&truncated_substrate_recipient_address)
		);
		assert_eq!(
			hex::encode(anchor_input.relayer),
			hex::encode(&truncated_substrate_relayer_address)
		);

		assert_eq!(hex::encode(anchor_input.refresh_commitment), hex::encode([0u8; 32]));
		assert_eq!(hex::encode(&anchor_input.roots[0]), hex::encode(&roots_raw[0]));
		assert_eq!(anchor_input.roots.len(), roots_raw.len());

		assert_eq!(anchor_input.refund, 1);
		assert_eq!(anchor_input.fee, 5);

		assert_eq!(anchor_input.leaf_index, 0);
		assert_eq!(hex::encode(&anchor_input.leaves[0]), hex::encode(leaf_bytes));
	}

	#[wasm_bindgen_test]
	fn generate_mixer_proof() {
		let MixerTestSetup {
			proof_input_builder,
			vk,
			..
		} = generate_mixer_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5);

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn anchor_proving_v1() {
		let AnchorTestSetup {
			proof_input_builder,
			vk,
			..
		} = generate_anchor_test_setup(
			DECODED_SUBSTRATE_ADDRESS,
			DECODED_SUBSTRATE_ADDRESS,
			ANCHOR_NOTE_V1_X5_4,
		);

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn anchor_proving_v2() {
		let AnchorTestSetup {
			proof_input_builder,
			vk,
			..
		} = generate_anchor_test_setup(
			DECODED_SUBSTRATE_ADDRESS,
			DECODED_SUBSTRATE_ADDRESS,
			ANCHOR_NOTE_V2_X5_4,
		);

		let proof_input = proof_input_builder.build_js().unwrap();

		let proof = generate_proof_js(proof_input.clone()).unwrap();

		// UNCOMENT FOR DEBUGGING
		// match proof_input.inner {
		// 	ProofInput::Mixer(_) => (),
		// 	ProofInput::Anchor(anchor_proof_input) => {
		// 		wasm_bindgen_test::console_log!("exponentiation {:?}",
		// anchor_proof_input.exponentiation); 		wasm_bindgen_test::console_log!("width
		// {:?}", anchor_proof_input.width); 		wasm_bindgen_test::console_log!("curve
		// {:?}", anchor_proof_input.curve); 		wasm_bindgen_test::console_log!("backend
		// {:?}", anchor_proof_input.backend); 		wasm_bindgen_test::console_log!("secret
		// {:?}", anchor_proof_input.secret); 		wasm_bindgen_test::console_log!("nullifier
		// {:?}", anchor_proof_input.nullifier); 		wasm_bindgen_test::console_log!("
		// recipient {:?}", anchor_proof_input.recipient); 		wasm_bindgen_test::
		// console_log!("relayer {:?}", anchor_proof_input.relayer); 		wasm_bindgen_test::
		// console_log!("refund {:?}", anchor_proof_input.refund); 		wasm_bindgen_test::
		// console_log!("fee {:?}", anchor_proof_input.fee); 		wasm_bindgen_test::
		// console_log!("chain id {:?}", anchor_proof_input.chain_id);
		// 		wasm_bindgen_test::console_log!("leaves {:?}", anchor_proof_input.leaves);
		// 		wasm_bindgen_test::console_log!("leaf index {:?}",
		// anchor_proof_input.leaf_index); 		wasm_bindgen_test::console_log!("roots {:?}",
		// anchor_proof_input.roots);

		// 		let params = setup_params(ArkCurve::Bn254, 5, 4);
		// 		let poseidon = Poseidon::<Bn254Fr>::new(params);

		// 		let chain_id = Bn254Fr::from(anchor_proof_input.chain_id);
		// 		let secret = Bn254Fr::from_le_bytes_mod_order(&anchor_proof_input.secret);
		// 		let nullifier =
		// Bn254Fr::from_le_bytes_mod_order(&anchor_proof_input.nullifier); 		let res =
		// poseidon.hash(&[chain_id, nullifier, secret]).unwrap(); 		let res_bytes =
		// res.into_repr().to_bytes_le(); 		let nullifier_hash =
		// poseidon.hash_two(&nullifier, &nullifier).unwrap(); 		let nullifier_hash_bytes
		// = nullifier_hash.into_repr().to_bytes_le(); 		wasm_bindgen_test::console_log!("
		// calc leaf {:?}", res_bytes); 		wasm_bindgen_test::console_log!("nullifier hash
		// {:?}", nullifier_hash_bytes); 	},
		// };

		// for p in &proof.public_inputs {
		// 	wasm_bindgen_test::console_log!("{:?}", p);
		// }

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn generate_vanchor_proof_input() {
		let vanchor_note_str = VANCHOR_NOTE_V2_X5_4;
		let protocol = JsValue::from("vanchor").into();
		let mut proof_input_builder = JsProofInputBuilder::new(protocol).unwrap();

		let note = JsNote::deserialize(vanchor_note_str).unwrap();
		let leaf = note.get_leaf_commitment().unwrap();
		let leaves: Array = vec![leaf].into_iter().collect();

		let mut tree_leaves = LeavesMapInput::new();
		tree_leaves
			.set_chain_leaves(2, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();
		tree_leaves
			.set_chain_leaves(3, Leaves::from(JsValue::from(leaves.clone())))
			.unwrap();

		let indices: Array = vec![JsValue::from("0"), JsValue::from("0")].into_iter().collect();
		let roots: Array = vec![
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
			Uint8Array::from([0u8; 32].to_vec().as_slice()),
		]
		.into_iter()
		.collect();
		proof_input_builder.set_leaves_map(tree_leaves).unwrap();
		proof_input_builder.set_metadata_from_note(&note).unwrap();

		proof_input_builder
			.set_indices(Indices::from(JsValue::from(indices)))
			.unwrap();
		proof_input_builder
			.set_roots(Leaves::from(JsValue::from(roots)))
			.unwrap();

		proof_input_builder.set_pk(JsString::from("0000")).unwrap();
		proof_input_builder.public_amount(JsString::from("3")).unwrap();
		proof_input_builder.chain_id(JsString::from("4")).unwrap();
		proof_input_builder
			.set_vanchor_output_config(
				OutputUtxoConfig {
					index: Some(1),
					amount: 0,
					chain_id: 3,
				},
				OutputUtxoConfig {
					index: Some(1),
					amount: 0,
					chain_id: 3,
				},
			)
			.unwrap();
		let notes: Array = vec![JsValue::from(note.clone())].into_iter().collect();
		// TODO Fix  `AsRef<wasm_bindgen::JsValue>` is not implemented for
		// `note::JsNote`
		proof_input_builder.set_notes(notes).unwrap();
		let proof_builder = proof_input_builder.build_js().unwrap();
		let vanchor_proof_input_payload = proof_builder.inner.vanchor_input().unwrap();
		assert_eq!(vanchor_proof_input_payload.public_amount, 3);
		assert_eq!(vanchor_proof_input_payload.chain_id, 4);
		assert_eq!(vanchor_proof_input_payload.indices, [0u64, 0u64].to_vec());
		assert_eq!(
			hex::encode(&vanchor_proof_input_payload.roots[0]),
			hex::encode([0u8; 32].to_vec())
		);
		assert_eq!(vanchor_proof_input_payload.roots.len(), 2);
		assert_eq!(
			vanchor_proof_input_payload.backend.to_string(),
			note.backend.unwrap().to_string()
		);
		assert_eq!(vanchor_proof_input_payload.exponentiation, note.exponentiation.unwrap());
		assert_eq!(vanchor_proof_input_payload.width, note.width.unwrap());
		assert_eq!(
			vanchor_proof_input_payload.curve.to_string(),
			note.curve.unwrap().to_string()
		);
		assert_eq!(hex::encode(vanchor_proof_input_payload.pk), "0000");
	}
	#[wasm_bindgen_test]
	fn generate_vanchor_proof() {
		let VAnchorTestSetup {
			proof_input_builder,
			roots_raw,
			notes,
			leaf_index,
			vk,
		} = generate_vanchor_test_rust_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS);
		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();
		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();

		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn test_arkworks_gadgets() {
		let mut rng = OsRng;
		let curve = ArkCurve::Bn254;
		let params3 = setup_params::<Bn254Fr>(curve, 5, 3);
		let tree_hasher = Poseidon::<Bn254Fr> { params: params3 };

		// Set up a random circuit and make pk/vk pair
		let random_circuit =
			VAnchorR1CSProverBn254_30_2_2_2::setup_random_circuit(curve, DEFAULT_LEAF, &mut rng).unwrap();
		let (proving_key, verifying_key) = setup_keys::<Bn254, _, _>(random_circuit.clone(), &mut rng).unwrap();

		// Make a proof now
		let public_amount = Bn254Fr::from(10u32);
		let ext_data_hash = Bn254Fr::rand(&mut rng);

		// Input Utxos
		let in_chain_id = 0u64;
		let in_amount = Bn254Fr::from(5u32);
		let index = 0u64;
		let in_utxo1 =
			VAnchorR1CSProverBn254_30_2_2_2::new_utxo(curve, in_chain_id, in_amount, Some(index), None, None, &mut rng)
				.unwrap();
		let in_utxo2 = VAnchorR1CSProverBn254_30_2_2_2::new_utxo(
			curve,
			in_chain_id,
			Bn254Fr::from(0u32),
			Some(index),
			None,
			None,
			&mut rng,
		)
		.unwrap();
		let in_utxos = [in_utxo1.clone(), in_utxo2.clone()];

		// Output Utxos
		let out_chain_id = 0u64;
		let out_amount = Bn254Fr::from(10u32);
		let out_utxo1 =
			VAnchorR1CSProverBn254_30_2_2_2::new_utxo(curve, out_chain_id, out_amount, None, None, None, &mut rng)
				.unwrap();
		let out_utxo2 =
			VAnchorR1CSProverBn254_30_2_2_2::new_utxo(curve, out_chain_id, out_amount, None, None, None, &mut rng)
				.unwrap();
		let out_utxos = [out_utxo1.clone(), out_utxo2.clone()];

		let leaf0 = in_utxo1.commitment;
		let (_, in_path0) = setup_tree_and_create_path::<Bn254Fr, Poseidon<Bn254Fr>, TREE_HEIGHT>(
			&tree_hasher,
			&vec![leaf0],
			0,
			&DEFAULT_LEAF,
		)
		.unwrap();
		let root0 = in_path0.calculate_root(&leaf0, &tree_hasher).unwrap();
		let leaf1 = in_utxo2.commitment;
		let (_, in_path1) = setup_tree_and_create_path::<Bn254Fr, Poseidon<Bn254Fr>, TREE_HEIGHT>(
			&tree_hasher,
			&vec![leaf1],
			0,
			&DEFAULT_LEAF,
		)
		.unwrap();
		let root1 = in_path1.calculate_root(&leaf1, &tree_hasher).unwrap();

		let in_leaves = [vec![leaf0.clone()], vec![leaf1.clone()]];
		let in_indices = [0; 2];
		let in_root_set = [root0.clone(), root1.clone()];

		let (circuit, .., pub_ins) = VAnchorR1CSProverBn254_30_2_2_2::setup_circuit_with_utxos(
			curve,
			Bn254Fr::from(in_chain_id),
			public_amount,
			ext_data_hash,
			in_root_set,
			in_indices,
			in_leaves,
			in_utxos.clone(),
			out_utxos.clone(),
			DEFAULT_LEAF,
		)
		.unwrap();

		let proof = prove::<Bn254, _, _>(circuit, &proving_key, &mut rng).unwrap();
		let res = verify::<Bn254>(&pub_ins, &verifying_key, &proof).unwrap();

		assert!(res);
		let (proving_key, verifying_key) = setup_keys_unchecked::<Bn254, _, _>(random_circuit, &mut rng).unwrap();
		let leaves_vec = vec![vec![leaf0.into_repr().to_bytes_le()], vec![leaf1
			.into_repr()
			.to_bytes_le()]];
		let in_root_set = vec![root0.into_repr().to_bytes_le(), root1.into_repr().to_bytes_le()];

		// test with the wasm setup
		let vanchor_proof_input = VAnchorProofPayload {
			exponentiation: 5,
			width: 5,
			curve: Curve::Bn254,
			backend: Backend::Arkworks,
			pk: proving_key,
			leaves: Default::default(),
			leaves_vec,
			roots: in_root_set,
			secret: in_utxos
				.to_vec()
				.into_iter()
				.map(|utxo| JsUtxo::new_from_bn254_utxo(utxo))
				.collect::<Vec<JsUtxo>>(),
			indices: vec![0, 0],
			chain_id: 0,
			public_amount: 10,
			output_config: [
				OutputUtxoConfig {
					amount: 10,
					index: None,
					chain_id: 0,
				},
				OutputUtxoConfig {
					amount: 10,
					index: None,
					chain_id: 0,
				},
			],
		};
		let VAnchorProofPayload {
			public_amount,
			backend,
			curve,
			width,
			secret,
			indices,
			leaves,
			exponentiation,
			roots,
			pk,
			chain_id,
			output_config,
			leaves_vec,
		} = vanchor_proof_input;
		let in_utxo = [secret[0].get_bn254_utxo().unwrap(), secret[1].get_bn254_utxo().unwrap()];
		let in_indices = [indices[0], indices[1]];
		let leaves1: Vec<_> = leaves_vec[0]
			.clone()
			.into_iter()
			.map(|x| Bn254Fr::from_le_bytes_mod_order(&x))
			.collect();
		let leaves2: Vec<_> = leaves_vec[1]
			.clone()
			.into_iter()
			.map(|x| Bn254Fr::from_le_bytes_mod_order(&x))
			.collect();
		let in_leaves = [leaves1, leaves2];
		let in_root_set = roots
			.into_iter()
			.map(|x| Bn254Fr::from_le_bytes_mod_order(&x))
			.collect::<Vec<_>>()
			.try_into()
			.unwrap();
		let ext_data_hash = Bn254Fr::rand(&mut rng);
		let utxo_o_1 = VAnchorR1CSProverBn254_30_2_2_2::new_utxo(
			ArkCurve::Bn254,
			output_config[0].chain_id,
			Bn254Fr::from(output_config[0].amount),
			None,
			None,
			None,
			&mut OsRng,
		)
		.unwrap();
		let utxo_o_2 = VAnchorR1CSProverBn254_30_2_2_2::new_utxo(
			ArkCurve::Bn254,
			output_config[1].chain_id,
			Bn254Fr::from(output_config[1].amount),
			None,
			None,
			None,
			&mut OsRng,
		)
		.unwrap();
		let utxos_out = [utxo_o_1, utxo_o_2];
		let (circuit, .., pub_ins) = VAnchorR1CSProverBn254_30_2_2_2::setup_circuit_with_utxos(
			ArkCurve::Bn254,
			Bn254Fr::from(in_chain_id),
			Bn254Fr::from(public_amount),
			ext_data_hash,
			in_root_set,
			in_indices,
			in_leaves,
			in_utxo,
			utxos_out,
			DEFAULT_LEAF,
		)
		.unwrap();
		let proof = prove_unchecked::<Bn254, _, _>(circuit, &pk, &mut rng).unwrap();
		let pub_ins: Vec<_> = pub_ins.into_iter().map(|x| x.into_repr().to_bytes_le()).collect();
		let is_valid_proof = verify_unchecked_raw::<Bn254>(&pub_ins, &verifying_key, &proof).unwrap();
		assert!(is_valid_proof);
	}
}
