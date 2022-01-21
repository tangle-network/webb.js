use std::convert::TryFrom;

use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::JsNote;
use crate::types::{Backend, Curve, Leaves, NotePrefix, OpStatusCode, Uint8Arrayx32};

mod anchor;
mod mixer;

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
	pub fn mixer_input(&self) -> Result<MixerProofInput, OpStatusCode> {
		match self {
			ProofInput::Mixer(mixer_input) => Ok(mixer_input.clone()),
			_ => Err(OpStatusCode::InvalidNotePrefix),
		}
	}

	pub fn anchor_input(&self) -> Result<AnchorProofInput, OpStatusCode> {
		match self {
			ProofInput::Anchor(anchor) => Ok(anchor.clone()),
			_ => Err(OpStatusCode::InvalidNotePrefix),
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
		let recipient = hex::decode(c).map_err(|_| OpStatusCode::InvalidRecipient)?;
		self.recipient = Some(recipient);
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
	use ark_serialize::CanonicalSerialize;
	use arkworks_circuits::setup::common::verify_unchecked_raw;
	use arkworks_circuits::setup::mixer::setup_keys_x5_5;
	use js_sys::Uint8Array;
	use wasm_bindgen_test::*;

	use crate::note::JsNote;

	use super::*;
	use arkworks_circuits::prelude::ark_bn254::Bn254;
	use arkworks_utils::utils::common::Curve as ArkCurve;

	const TREE_DEPTH: u32 = 30;
	#[wasm_bindgen_test]
	fn js_setup() {
		let (pk, vk) = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng).unwrap();
		let mut pk_uncompressed_bytes = Vec::new();
		CanonicalSerialize::serialize_unchecked(&pk, &mut pk_uncompressed_bytes).unwrap();

		let note_str = "webb.mixer:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let truncated_substrate_address = truncate_and_pad(&hex::decode(decoded_substrate_address).unwrap());
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();
		let mut js_builder = ProofInputBuilder::new();
		let leave: Uint8Array = note.get_leaf_commitment().unwrap();
		let leave_bytes: Vec<u8> = leave.to_vec();
		let leaves_ua: Array = vec![leave].into_iter().collect();

		js_builder.set_leaf_index(JsString::from("0"));
		js_builder.set_leaves(Leaves::from(JsValue::from(leaves_ua)));

		js_builder.set_fee(JsString::from("5"));
		js_builder.set_refund(JsString::from("1"));

		js_builder.set_relayer(JsString::from(decoded_substrate_address));
		js_builder.set_recipient(JsString::from(decoded_substrate_address));

		js_builder.set_pk(JsString::from(hex::encode(vec![])));
		js_builder.set_note(&note);

		let proof_input = js_builder.build().unwrap();
		let mixer_input = proof_input.mixer_input().unwrap();

		assert_eq!(
			hex::encode(mixer_input.recipient),
			hex::encode(&truncated_substrate_address)
		);
		assert_eq!(
			hex::encode(mixer_input.relayer),
			hex::encode(&truncated_substrate_address)
		);

		assert_eq!(mixer_input.refund, 1);
		assert_eq!(mixer_input.fee, 5);

		assert_eq!(mixer_input.leaf_index, 0);
		assert_eq!(hex::encode(&mixer_input.leaves[0]), hex::encode(leave_bytes));
	}

	#[wasm_bindgen_test]
	fn generate_proof() {
		let (pk, vk) = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng).unwrap();

		let note_str = "webb.mixer:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();
		let mut js_builder = ProofInputBuilder::new();
		let leave: Uint8Array = note.get_leaf_commitment().unwrap();
		let leave_bytes: Vec<u8> = leave.to_vec();
		let leaves_ua: Array = vec![leave].into_iter().collect();

		js_builder.set_leaf_index(JsString::from("0"));
		js_builder.set_leaves(Leaves::from(JsValue::from(leaves_ua)));

		js_builder.set_fee(JsString::from("5"));
		js_builder.set_refund(JsString::from("1"));

		js_builder.set_relayer(JsString::from(decoded_substrate_address));
		js_builder.set_recipient(JsString::from(decoded_substrate_address));
		js_builder.set_pk(JsString::from(hex::encode(&pk)));
		js_builder.set_note(&note);
		let proof_input = js_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();
		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}

	#[wasm_bindgen_test]
	fn is_valid_merkle_root() {
		let (pk, vk) = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng).unwrap();
		let rigid_leaf = hex::decode("66b27a63d25d5187381a251ddf36c0d195f69f303826ec45e534806746549820").unwrap();
		let rigid_root = hex::decode("6caaa2fea7789832bb2df2e74921c8058e5c66e8a842fe9d389864c006e0492b").unwrap();
		let note_str = "webb.mixer:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();
		let mut js_builder = ProofInputBuilder::new();
		let (test_leaf, ..) = note.get_leaf_and_nullifier().unwrap();

		// This fails
		// assert_eq!(test_leaf, rigid_leaf);

		let leaf = note.get_leaf_commitment().unwrap();
		let leaves_ua: Array = vec![leaf].into_iter().collect();

		js_builder.set_leaf_index(JsString::from("0"));
		js_builder.set_leaves(Leaves::from(JsValue::from(leaves_ua)));

		js_builder.set_fee(JsString::from("5"));
		js_builder.set_refund(JsString::from("1"));

		js_builder.set_relayer(JsString::from(decoded_substrate_address));
		js_builder.set_recipient(JsString::from(decoded_substrate_address));
		js_builder.set_pk(JsString::from(hex::encode(&pk)));
		js_builder.set_note(&note);

		let proof_input = js_builder.build_js().unwrap();
		let proof = generate_proof_js(proof_input).unwrap();
		// This fails
		// assert_eq!(hex::encode(&proof.leaf.clone()), hex::encode(rigid_leaf));
		// assert_eq!(hex::encode(&proof.root.clone()), hex::encode(rigid_root));
		let is_valid_proof = verify_unchecked_raw::<Bn254>(&proof.public_inputs, &vk, &proof.proof).unwrap();
		assert!(is_valid_proof);
	}
}
