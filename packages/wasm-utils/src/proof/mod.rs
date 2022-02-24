#![allow(clippy::unused_unit)]

use std::convert::{TryFrom, TryInto};

use ark_ff::{BigInteger, PrimeField};
use arkworks_circuits::prelude::ark_bls12_381::Bls12_381;
use arkworks_circuits::prelude::ark_bn254::Bn254;
use arkworks_circuits::setup::common::{verify_unchecked_raw, Tree_x5};

use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::JsNote;
use crate::types::{Backend, Curve, Leaves, NoteProtocol, OpStatusCode, OperationError, Uint8Arrayx32, WasmCurve};

mod anchor;
mod mixer;
mod test_utils;
// #[cfg(test)]
// mod test_utils;

pub fn truncate_and_pad(t: &[u8]) -> Vec<u8> {
	let mut truncated_bytes = t[..20].to_vec();
	truncated_bytes.extend_from_slice(&[0u8; 12]);
	truncated_bytes
}

#[allow(clippy::unused_unit)]
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
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct MixerProofInput {
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
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct AnchorProofInput {
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
				let message = "Can't construct proof input for AnchorProofInput from mixer input".to_string();
				Err(OperationError::new_with_message(
					OpStatusCode::InvalidNoteProtocol,
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
pub struct JsProofInput {
	#[wasm_bindgen(skip)]
	pub inner: ProofInput,
}
#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq, Default)]
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
		let proof_target = note.protocol;
		let width = note.width;
		let exponentiation = note.exponentiation;
		let backend = note.backend;
		let curve = note.curve;
		let note_secrets = note.secrets;
		let processed_relayer = truncate_and_pad(&relayer);
		let processed_recipient = truncate_and_pad(&recipient);
		match proof_target {
			NoteProtocol::Mixer => {
				// Mixer secrets are structures as a vector of [secret, nullifier] or
				// concatenated bytes
				let mut secret = Vec::new();
				let mut nullifier = Vec::new();
				if note_secrets.len() == 1 && note_secrets[0].len() >= 64 {
					secret.extend_from_slice(&note_secrets[0][0..32]);
					nullifier.extend_from_slice(&note_secrets[0][32..64]);
				} else {
					secret = note_secrets[0].clone();
					nullifier = note_secrets[1].clone();
				}

				let mixer_proof_input = MixerProofInput {
					exponentiation: exponentiation.unwrap_or(5),
					width: width.unwrap_or(3),
					curve: curve.unwrap_or(Curve::Bn254),
					backend: backend.unwrap_or(Backend::Circom),
					pk,
					recipient: processed_recipient,
					relayer: processed_relayer,
					refund,
					fee,
					leaf_index,
					leaves,
					secret,
					nullifier,
					chain_id: 0,
				};
				Ok(ProofInput::Mixer(mixer_proof_input))
			}
			NoteProtocol::Anchor => {
				// Mixer secrets are structures as a vector of [secret, nullifier] or
				// concatenated bytes
				let mut chain_id = note
					.target_chain_id
					.parse()
					.map_err(|_| OpStatusCode::InvalidTargetChain)?;
				let mut secret = Vec::new();
				let mut nullifier = Vec::new();
				if note_secrets.len() == 1 && note_secrets[0].len() >= 64 {
					secret.extend_from_slice(&note_secrets[0][0..32]);
					nullifier.extend_from_slice(&note_secrets[0][32..64]);
				} else {
					secret = note_secrets[0].clone();
					nullifier = note_secrets[1].clone();

					// Anchor note secrets are structure as a vector of [chain_id, secret,
					// nullifier]
					let chain_id_bytes = note_secrets[0].clone();
					if chain_id_bytes.len() == 6 {
						let mut temp_bytes = [0u8; 8];
						temp_bytes[2..8].copy_from_slice(&chain_id_bytes[0..6]);
						chain_id = u128::from(u64::from_be_bytes(temp_bytes));
					} else if chain_id_bytes.len() == 8 {
						let mut temp_bytes = [0u8; 8];
						temp_bytes[0..8].copy_from_slice(&chain_id_bytes);
						chain_id = u128::from(u64::from_be_bytes(temp_bytes));
					} else {
						return Err(OpStatusCode::InvalidTargetChain);
					}
				}

				let commitment = self.commitment.ok_or(OpStatusCode::CommitmentNotSet)?;
				let roots = self.roots.ok_or(OpStatusCode::RootsNotSet)?;

				let anchor_input = AnchorProofInput {
					exponentiation: exponentiation.unwrap_or(5),
					width: width.unwrap_or(3),
					curve: curve.unwrap_or(Curve::Bn254),
					backend: backend.unwrap_or(Backend::Circom),
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
					commitment,
				};
				Ok(ProofInput::Anchor(anchor_input))
			}
			_ => Err(OpStatusCode::InvalidNoteProtocol),
		}
	}
}
use ark_bn254::Fr as Bn254Fr;
use arkworks_utils::utils::common::{setup_params_x5_3, setup_params_x5_4, Curve as ArkCurve};
use test_utils::AnchorSetup30_2;
use wasm_bindgen::__rt::std::collections::btree_map::BTreeMap;

#[wasm_bindgen]
pub struct AnchorMTBn254X5 {
	#[wasm_bindgen(skip)]
	pub inner: Tree_x5<Bn254Fr>,
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
		let params3 = setup_params_x5_3::<Bn254Fr>(curve);
		let params4 = setup_params_x5_4::<Bn254Fr>(curve);

		let anchor_setup = AnchorSetup30_2::new(params3, params4);

		let (tree, _) = anchor_setup.setup_tree_and_path(&leaves, leaf_index).unwrap();
		Ok(Self { inner: tree })
	}

	#[wasm_bindgen(getter)]
	pub fn root(&self) -> JsString {
		let root = self.inner.root().inner().into_repr().to_bytes_le().to_vec();
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

		self.inner
			.insert_batch(&leaves_bt)
			.map_err(|_| OpStatusCode::InvalidLeaves)?;
		Ok(())
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
	.map_err(|e| OperationError::new_with_message(OpStatusCode::InvalidProofParameters, e.to_string()))?;

	Ok(is_valid)
}
#[cfg(test)]
mod test {
	use arkworks_circuits::prelude::ark_bn254::Bn254;
	use arkworks_circuits::setup::common::verify_unchecked_raw;

	use wasm_bindgen_test::*;

	use crate::proof::test_utils::{
		generate_anchor_test_setup, generate_mixer_test_setup, AnchorTestSetup, MixerTestSetup, ANCHOR_NOTE_V1_X5_4,
		DECODED_SUBSTRATE_ADDRESS, MIXER_NOTE_V1_X5_5,
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
		} = generate_anchor_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, ANCHOR_NOTE_V1_X5_4);
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
		} = generate_anchor_test_setup(DECODED_SUBSTRATE_ADDRESS, DECODED_SUBSTRATE_ADDRESS, ANCHOR_NOTE_V1_X5_4);

		let proof_input = proof_input_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();

		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}
}
