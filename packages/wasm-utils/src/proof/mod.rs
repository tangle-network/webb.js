#![allow(clippy::unused_unit)]

use core::convert::{TryFrom, TryInto};

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
	AnchorR1CSProverBn254_30_2, MixerR1CSProverBn254_30, VAnchorR1CSProverBn254_30_16_16_2,
	VAnchorR1CSProverBn254_30_16_2_2, VAnchorR1CSProverBn254_30_2_16_2, VAnchorR1CSProverBn254_30_2_2_2, DEFAULT_LEAF,
	TREE_HEIGHT,
};

mod anchor;
pub mod ext_data;
mod mixer;
mod test;
#[cfg(test)]
mod test_utils;
mod vanchor;

pub fn truncate_and_pad(t: &[u8]) -> Vec<u8> {
	let mut truncated_bytes = t[..20].to_vec();
	truncated_bytes.extend_from_slice(&[0u8; 12]);
	truncated_bytes
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct VAnchorProof {
	#[wasm_bindgen(skip)]
	pub proof: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub public_inputs: Vec<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub output_notes: Vec<JsNote>,
	#[wasm_bindgen(skip)]
	pub input_utxos: Vec<JsUtxo>,
	#[wasm_bindgen(skip)]
	pub public_amount: [u8; 32],
}
#[wasm_bindgen]
impl VAnchorProof {
	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = publicInputs)]
	pub fn public_inputs_raw(&self) -> Array {
		let inputs: Array = self
			.public_inputs
			.iter()
			.map(|x| JsString::from(hex::encode(x)))
			.collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = outputNotes)]
	pub fn output_notes(&self) -> Array {
		let inputs: Array = self.output_notes.clone().into_iter().map(JsValue::from).collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = inputUtxos)]
	pub fn inputs_utxos(&self) -> Array {
		let inputs: Array = self.input_utxos.clone().into_iter().map(JsValue::from).collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	pub fn proof(&self) -> JsString {
		JsString::from(hex::encode(&self.proof))
	}

	#[wasm_bindgen(js_name = publicAmount)]
	#[wasm_bindgen(getter)]
	pub fn public_amount(&self) -> Uint8Array {
		Uint8Array::from(self.public_amount.to_vec().as_slice())
	}
}

#[derive(Debug, Clone)]
pub enum ProofOutput {
	Mixer(MixerProof),
	Anchor(AnchorProof),
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
			ProofOutput::Anchor(_) => "anchor",
			ProofOutput::VAnchor(_) => "vanchor",
		};

		JsValue::from(protocol).into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = "anchorProof")]
	pub fn anchor_proof(&self) -> Result<AnchorProof, OperationError> {
		match self.inner.clone() {
			ProofOutput::Anchor(proof) => Ok(proof),
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
		}
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

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct MixerProof {
	#[wasm_bindgen(skip)]
	pub proof: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub nullifier_hash: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub root: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub public_inputs: Vec<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub leaf: Vec<u8>,
}
#[wasm_bindgen]
impl MixerProof {
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
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct AnchorProof {
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

#[wasm_bindgen]
impl AnchorProof {
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
	pub ext_data_hash: Vec<u8>,
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
	pub output_utxos: [JsUtxo; 2],
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
	pub ext_data_hash: Option<Vec<u8>>,
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
	pub output_config: Option<[JsUtxo; 2]>,
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

impl VAnchorProofInput {
	pub fn build(self) -> Result<VAnchorProofPayload, OperationError> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let secret = self.secret.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;
		let ext_data_hash = self.ext_data_hash.ok_or(OpStatusCode::InvalidExtDataHash)?;
		let roots = self.roots.ok_or(OpStatusCode::InvalidRoots)?;
		let chain_id = self.chain_id.ok_or(OpStatusCode::InvalidChainId)?;
		let indices = self.indices.ok_or(OpStatusCode::InvalidIndices)?;
		let public_amount = self.public_amount.ok_or(OpStatusCode::InvalidPublicAmount)?;
		let output_utxos = self.output_config.ok_or(OpStatusCode::InvalidPublicAmount)?;

		let exponentiation = self.exponentiation.unwrap_or(5);
		let width = self.width.unwrap_or(3);
		let curve = self.curve.unwrap_or(Curve::Bn254);
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		// Input UTXO should have the same chain_id
		// For default UTXOS the amount and the index should be `0`
		// Duplicate indices is ONLY allowed for the default UTXOs
		// chain_id of the first item in the list
		let mut invalid_utxo_chain_id_indices = vec![];
		let mut invalid_utxo_dublicate_nullifiers = vec![];
		let utxos_chain_id = secret[0].clone().chain_id_raw();
		// validate the all inputs share the same chain_id
		secret.iter().enumerate().for_each(|(index, utxo)| {
			if utxo.get_chain_id_raw() != utxos_chain_id {
				invalid_utxo_chain_id_indices.push(index)
			}
		});
		let non_default_utxo = secret
			.iter()
			.enumerate()
			.filter(|(_, utxo)| {
				// filter for non-default utxos
				utxo.amount_raw() != 0 && utxo.get_index().unwrap_or(0) != 0
			})
			.collect::<Vec<_>>();
		non_default_utxo.iter().for_each(|(index, utxo)| {
			let has_dublicate = non_default_utxo
				.iter()
				.find(|(root_index, root_utxo)| root_index != index && root_utxo.get_index() == utxo.get_index());
			if has_dublicate.is_some() {
				invalid_utxo_dublicate_nullifiers.push(index)
			}
		});
		if !invalid_utxo_chain_id_indices.is_empty() || !invalid_utxo_dublicate_nullifiers.is_empty() {
			let message = format!(
				"Invalid UTXOs: utxo indices has invalid chain_id {:?} ,non-default utxos with an duplicate index {:?}",
				invalid_utxo_chain_id_indices, invalid_utxo_dublicate_nullifiers
			);
			let mut op: OperationError =
				OperationError::new_with_message(OpStatusCode::InvalidProofParameters, message);
			op.data = Some(format!(
				"{{ duplicateIndices:{:?} , invalidChainId:{:?} }}",
				invalid_utxo_chain_id_indices, invalid_utxo_dublicate_nullifiers
			));
			return Err(op);
		}

		// validate amounts
		let mut in_amount = public_amount;
		secret.iter().for_each(|utxo| {
			let utxo_amount: i128 = utxo
				.amount_raw()
				.try_into()
				.expect("Failed to convert utxo value to i128");
			in_amount += utxo_amount
		});
		let mut out_amount = 0u128;
		output_utxos
			.iter()
			.for_each(|output_config| out_amount += output_config.amount_raw());
		let out_amount: i128 = out_amount
			.try_into()
			.expect("Failed to convert accumulated in amounts  value to i128");
		if out_amount != in_amount {
			let message = format!(
				"Output amount and input amount  don't match input({}) != output({})",
				in_amount, out_amount
			);
			let mut oe = OperationError::new_with_message(OpStatusCode::InvalidProofParameters, message);
			oe.data = Some(format!("{{ inputAmount:{} ,outputAmount:{}}}", in_amount, out_amount));
			return Err(oe);
		}
		Ok(VAnchorProofPayload {
			exponentiation,
			width,
			curve,
			backend,
			pk,
			leaves,
			ext_data_hash,
			roots,
			secret,
			indices,
			chain_id: chain_id.try_into().unwrap(),
			public_amount,
			output_utxos,
		})
	}
}

#[derive(Debug, Clone)]
pub enum ProofInput {
	Mixer(MixerProofPayload),
	Anchor(AnchorProofPayload),
	VAnchor(Box<VAnchorProofPayload>),
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
	Mixer(MixerProofInput),
	Anchor(AnchorProofInput),
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

	// Should be called after setting backend curve roots secret
	pub fn set_output_config(&mut self, output_config: [OutputUtxoConfig; 2]) -> Result<[JsUtxo; 2], OperationError> {
		match self {
			Self::VAnchor(input) => {
				let backend = input.backend.ok_or(OpStatusCode::InvalidBackend)?;
				let curve = input.curve.ok_or(OpStatusCode::InvalidCurve)?;
				let roots = input.roots.as_ref().ok_or(OpStatusCode::InvalidRoots)?.len();
				let secret = input.secret.as_ref().ok_or(OpStatusCode::InvalidNoteSecrets)?.len();
				let output_utxo =
					vanchor::setup_output_utxos(output_config, backend, curve, secret, roots, &mut OsRng)?;
				input.output_config = Some(output_utxo.clone());
				Ok(output_utxo)
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
			_ => Err(OpStatusCode::ProofInputFieldInstantiationProtocolInvalid.into()),
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
			ProofInputBuilder::Anchor(input) => {
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
			ProofInputBuilder::Anchor(input) => {
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
			ProofInputBuilder::Anchor(input) => {
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
			ProofInputBuilder::Anchor(input) => {
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
	) -> Result<Array, JsValue> {
		let output = self.inner.set_output_config([utxo1, utxo2])?;
		let output: Array = output.into_iter().map(JsValue::from).collect();
		Ok(output)
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
			ProofInputBuilder::Mixer(_) | ProofInputBuilder::Anchor(_) => self.set_meta_data(note)?,
			_ => return Err(OpStatusCode::InvalidNoteProtocol.into()),
		}

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
				ProofInput::Mixer(mixer_payload)
			}
			ProofInputBuilder::Anchor(anchor_proof_input) => {
				let anchor_payload = anchor_proof_input.build()?;
				ProofInput::Anchor(anchor_payload)
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
			.map(|v| Bn254Fr::from_le_bytes_mod_order(v.0.as_ref()))
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
		(NoteProtocol::Anchor, ..) => {
			let (c, ..) = AnchorR1CSProverBn254_30_2::setup_random_circuit(ArkCurve::Bn254, DEFAULT_LEAF, &mut OsRng)
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
			mixer::create_proof(mixer_proof_input, &mut rng).map(|v| JsProofOutput {
				inner: ProofOutput::Mixer(v),
			})
		}
		ProofInput::Anchor(anchor_proof_input) => {
			anchor::create_proof(anchor_proof_input, &mut rng).map(|v| JsProofOutput {
				inner: ProofOutput::Anchor(v),
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

#[wasm_bindgen]
pub fn validate_proof(proof: &AnchorProof, vk: JsString, curve: WasmCurve) -> Result<bool, JsValue> {
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
