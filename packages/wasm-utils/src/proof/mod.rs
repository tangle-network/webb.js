use std::convert::{TryFrom, TryInto};

use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::JsNote;
use crate::types::{Backend, Curve, Leaves, NotePrefix, OpStatusCode, OperationError, Uint8Arrayx32};

mod anchor;
mod mixer;
#[cfg(test)]
mod test_utils;

pub fn truncate_and_pad(t: &[u8]) -> Vec<u8> {
	let mut truncated_bytes = t[..20].to_vec();
	truncated_bytes.extend_from_slice(&[0u8; 12]);
	truncated_bytes
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
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
}
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct MixerProofInput {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub secrets: Vec<u8>,
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
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct AnchorProofInput {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub secrets: Vec<u8>,
	pub nullifier: Vec<u8>,
	pub recipient: Vec<u8>,
	pub relayer: Vec<u8>,
	pub pk: Vec<u8>,
	pub refund: u128,
	pub fee: u128,
	pub chain_id: u128,
	pub leaves: Vec<Vec<u8>>,
	pub leaf_index: u64,
	/// get roots for linkable tree
	pub roots: Vec<Vec<u8>>,
	/// EMPTY commitment if withdrawing [0u8;32]
	/// not EMPTY if refreshing
	pub commitment: [u8; 32],
}

#[derive(Debug, Eq, PartialEq, Clone)]
pub enum ProofInput {
	Mixer(MixerProofInput),
	Anchor(AnchorProofInput),
}

impl ProofInput {
	pub fn mixer_input(&self) -> Result<MixerProofInput, OperationError> {
		match self {
			ProofInput::Mixer(mixer_input) => Ok(mixer_input.clone()),
			ProofInput::Anchor(_) => {
				let message = "Can't cant construct proof input for AnchorProofInput from mixer input ".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNotePrefix,
					message,
				))
			}
		}
	}

	pub fn anchor_input(&self) -> Result<AnchorProofInput, OperationError> {
		match self {
			ProofInput::Anchor(anchor) => Ok(anchor.clone()),
			ProofInput::Mixer(_) => {
				let message = "Can't cant construct proof input for MixerProofInput from anchor input ".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNotePrefix,
					message,
				))
			}
		}
	}
}

#[wasm_bindgen]
pub struct JsProofInput {
	#[wasm_bindgen(skip)]
	pub inner: ProofInput,
}
#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct ProofInputBuilder {
	#[wasm_bindgen(skip)]
	pub recipient: Option<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub relayer: Option<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub leaves: Option<Vec<[u8; 32]>>,
	#[wasm_bindgen(skip)]
	pub leaf_index: Option<u64>,
	#[wasm_bindgen(skip)]
	pub fee: Option<u128>,
	#[wasm_bindgen(skip)]
	pub refund: Option<u128>,
	#[wasm_bindgen(skip)]
	pub pk: Option<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub note: Option<JsNote>,
	#[wasm_bindgen(skip)]
	/// required only for [anchor,]
	pub commitment: Option<[u8; 32]>,
	#[wasm_bindgen(skip)]
	/// required only for [anchor,]
	pub roots: Option<Vec<Vec<u8>>>,
}

impl ProofInputBuilder {
	pub fn build(self) -> Result<ProofInput, OpStatusCode> {
		let note = self.note.ok_or(OpStatusCode::ProofBuilderNoteNotSet)?;
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let recipient = self.recipient.ok_or(OpStatusCode::InvalidRecipient)?;
		let relayer = self.relayer.ok_or(OpStatusCode::InvalidRelayer)?;

		let leaf_index = self.leaf_index.ok_or(OpStatusCode::InvalidLeafIndex)?;
		let leaves: Vec<_> = self
			.leaves
			.ok_or(OpStatusCode::InvalidLeaves)?
			.into_iter()
			.map(|leaf| leaf.to_vec())
			.collect();

		let fee = self.fee.ok_or(OpStatusCode::InvalidFee)?;
		let refund = self.refund.ok_or(OpStatusCode::InvalidRefund)?;

		let target_chain_id = note
			.target_chain_id
			.parse()
			.map_err(|_| OpStatusCode::InvalidTargetChain)?;
		let proof_target = note.prefix;
		let width = note.width;
		let exponentiation = note.exponentiation;
		let backend = note.backend;
		let curve = note.curve;
		let note_secrets = note.secret;
		let secrets = note_secrets[..32].to_vec();
		let nullifier = note_secrets[32..64].to_vec();

		let processed_relayer = truncate_and_pad(&relayer);
		let processed_recipient = truncate_and_pad(&recipient);
		match proof_target {
			NotePrefix::Mixer => {
				let mixer_proof_input = MixerProofInput {
					exponentiation,
					width,
					curve,
					pk,
					recipient: processed_recipient,
					relayer: processed_relayer,
					refund,
					fee,
					leaf_index,
					leaves,
					secrets,
					nullifier,
					backend,
					chain_id: 0,
				};
				Ok(ProofInput::Mixer(mixer_proof_input))
			}
			NotePrefix::Anchor => {
				let commitment = self.commitment.ok_or(OpStatusCode::CommitmentNotSet)?;
				let roots = self.roots.ok_or(OpStatusCode::RootsNotSet)?;

				let anchor_input = AnchorProofInput {
					exponentiation,
					width,
					curve,
					backend,
					secrets,
					nullifier,
					recipient: processed_recipient,
					relayer: processed_relayer,
					pk,
					refund,
					fee,
					chain_id: target_chain_id,
					leaves,
					leaf_index,
					roots,
					commitment,
				};
				Ok(ProofInput::Anchor(anchor_input))
			}
			_ => Err(OpStatusCode::InvalidNotePrefix),
		}
	}
}

impl Default for ProofInputBuilder {
	fn default() -> Self {
		Self {
			recipient: None,
			relayer: None,
			leaves: None,
			leaf_index: None,
			fee: None,
			refund: None,
			pk: None,
			note: None,
			commitment: None,
			roots: None,
		}
	}
}

#[wasm_bindgen]
impl ProofInputBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
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
		self.roots = Some(rs);
		Ok(())
	}

	#[wasm_bindgen(js_name = setCommiment)]
	pub fn set_commitment(&mut self, commitment: JsString) -> Result<(), JsValue> {
		let c: String = commitment.into();
		let commitment = hex::decode(c).map_err(|_| OpStatusCode::CommitmentNotSet)?;
		let commitment: [u8; 32] = commitment.try_into().map_err(|_| OpStatusCode::CommitmentNotSet)?;
		self.commitment = Some(commitment);
		Ok(())
	}

	#[wasm_bindgen(js_name = setRecipient)]
	pub fn set_recipient(&mut self, recipient: JsString) -> Result<(), JsValue> {
		let r: String = recipient.into();
		let recipient = hex::decode(r).map_err(|_| OpStatusCode::InvalidRecipient)?;
		self.recipient = Some(recipient);
		Ok(())
	}

	#[wasm_bindgen(js_name = setRelayer)]
	pub fn set_relayer(&mut self, relayer: JsString) -> Result<(), JsValue> {
		let r: String = relayer.into();
		let hex_data = hex::decode(r).map_err(|_| OpStatusCode::DeserializationFailed)?;
		self.relayer = Some(hex_data);
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
			.map(|v| v.0)
			.collect();
		self.leaves = Some(ls);
		Ok(())
	}

	#[wasm_bindgen(js_name = setLeafIndex)]
	pub fn set_leaf_index(&mut self, leaf_index: JsString) -> Result<(), JsValue> {
		let leaf_index: String = leaf_index.into();
		let leaf_index = leaf_index
			.as_str()
			.parse()
			.map_err(|_| OpStatusCode::InvalidLeafIndex)?;
		self.leaf_index = Some(leaf_index);
		Ok(())
	}

	#[wasm_bindgen(js_name = setFee)]
	pub fn set_fee(&mut self, fee: JsString) -> Result<(), JsValue> {
		let fee: String = fee.into();
		let fee = fee.as_str().parse().map_err(|_| OpStatusCode::InvalidFee)?;
		self.fee = Some(fee);
		Ok(())
	}

	#[wasm_bindgen(js_name = setRefund)]
	pub fn set_refund(&mut self, refund: JsString) -> Result<(), JsValue> {
		let refund: String = refund.into();
		let refund = refund.as_str().parse().map_err(|_| OpStatusCode::InvalidRefund)?;
		self.refund = Some(refund);
		Ok(())
	}

	#[wasm_bindgen(js_name = setPk)]
	pub fn set_pk(&mut self, pk: JsString) -> Result<(), JsValue> {
		let p: String = pk.into();
		let proving_key = hex::decode(p).map_err(|_| OpStatusCode::InvalidProvingKey)?;
		self.pk = Some(proving_key);
		Ok(())
	}

	#[wasm_bindgen(js_name = setNote)]
	pub fn set_note(&mut self, note: &JsNote) -> Result<(), JsValue> {
		self.note = Some(note.clone());
		Ok(())
	}

	#[wasm_bindgen]
	pub fn build_js(self) -> Result<JsProofInput, JsValue> {
		let proof_input = self.build()?;
		Ok(JsProofInput { inner: proof_input })
	}
}

#[wasm_bindgen]
pub fn generate_proof_js(proof_input: JsProofInput) -> Result<Proof, JsValue> {
	let mut rng = OsRng;
	let proof_input_value = proof_input.inner;
	match proof_input_value {
		ProofInput::Mixer(mixer_proof_input) => mixer::create_proof(mixer_proof_input, &mut rng),
		ProofInput::Anchor(anchor_proof_input) => anchor::create_proof(anchor_proof_input, &mut rng),
	}
	.map_err(|e| e.into())
}
#[cfg(test)]
mod test {

	use arkworks_circuits::setup::anchor::AnchorProverSetup;
	use arkworks_circuits::setup::common::verify_unchecked_raw;

	use wasm_bindgen_test::*;

	use super::*;
	use crate::proof::test_utils::{
		generate_anchor_test_setup, generate_mixer_test_setup, AnchorTestSetup, MixerTestSetup, ANCHOR_NOTE_X5_4,
		DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_X5_5,
	};

	use arkworks_circuits::prelude::ark_bn254::Bn254;
	use arkworks_utils::utils::common::Curve as ArkCurve;

	const TREE_DEPTH: usize = 30;

	#[wasm_bindgen_test]
	fn mixer_js_setup() {
		let MixerTestSetup {
			relayer,
			recipient,
			proof_input_builder,
			root,
			leaf_bytes,
			leaf_index,
			vk,
		} = generate_mixer_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_X5_5);

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
			leaf_index,
			vk,
		} = generate_anchor_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, ANCHOR_NOTE_X5_4);
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

		assert_eq!(hex::encode(anchor_input.commitment), hex::encode([0u8; 32]));
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
		} = generate_mixer_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_X5_5);

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn anchor_proving() {
		let AnchorTestSetup {
			proof_input_builder,
			vk,
			..
		} = generate_anchor_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, ANCHOR_NOTE_X5_4);

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}
}
