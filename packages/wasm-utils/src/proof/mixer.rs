use std::convert::{TryFrom, TryInto};
use std::ops::Deref;

use arkworks_circuits::setup::mixer::setup_proof_x5_5;
use arkworks_utils::prelude::ark_bls12_381::Bls12_381;
use arkworks_utils::prelude::ark_bn254::Bn254;
use arkworks_utils::utils::common::Curve as ArkCurve;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::JsNote;
use crate::types::{Backend, Curve, Leaves, OpStatusCode, Uint8Arrayx32};

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
#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct ProofInput {
	#[wasm_bindgen(skip)]
	pub recipient: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub relayer: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub leaves: Vec<[u8; 32]>,
	#[wasm_bindgen(skip)]
	pub leaf_index: u64,
	#[wasm_bindgen(skip)]
	pub fee: u128,
	#[wasm_bindgen(skip)]
	pub refund: u128,
	#[wasm_bindgen(skip)]
	pub pk: Vec<u8>,
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct JsProofInputBuilder {
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
}

impl JsProofInputBuilder {
	pub fn build(self) -> Result<ProofInput, OpStatusCode> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let recipient = self.recipient.ok_or(OpStatusCode::InvalidRecipient)?;
		let relayer = self.relayer.ok_or(OpStatusCode::InvalidRelayer)?;

		let leaf_index = self.leaf_index.ok_or(OpStatusCode::InvalidLeafIndex)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;

		let fee = self.fee.ok_or(OpStatusCode::InvalidFee)?;
		let refund = self.refund.ok_or(OpStatusCode::InvalidRefund)?;

		Ok(ProofInput {
			pk,
			relayer: truncate_and_pad(&relayer),
			recipient: truncate_and_pad(&recipient),
			refund,
			fee,
			leaf_index,
			leaves,
		})
	}
}

#[wasm_bindgen]
impl JsProofInputBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		JsProofInputBuilder {
			recipient: None,
			relayer: None,
			leaves: None,
			leaf_index: None,
			fee: None,
			refund: None,
			pk: None,
		}
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

	#[wasm_bindgen]
	pub fn build_js(self) -> Result<ProofInput, JsValue> {
		self.build().map_err(|e| e.into())
	}
}

#[wasm_bindgen]
pub fn generate_proof_js(js_note: JsNote, proof_input: ProofInput) -> Result<Proof, JsValue> {
	let note = js_note;
	let width = note.width;
	let exponentiation = note.exponentiation;
	let backend = note.backend;
	let curve = note.curve;
	let note_secrets = note.secret;
	let secrets = note_secrets[..32].to_vec();
	let nullifier = note_secrets[32..64].to_vec();
	let leaves: Vec<_> = proof_input.leaves.into_iter().map(|i| i.to_vec()).collect();
	let leaf_index = proof_input.leaf_index;
	let recipient_raw = proof_input.recipient;
	let relayer_raw = proof_input.relayer;

	let fee = proof_input.fee;
	let refund = proof_input.refund;
	let pk = proof_input.pk;

	let mut rng = OsRng;
	let (proof, _leaf, nullifier_hash, root, _public_inputs) = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 5) => setup_proof_x5_5::<Bn254, OsRng>(
			ArkCurve::Bn254,
			secrets,
			nullifier,
			leaves,
			leaf_index,
			recipient_raw,
			relayer_raw,
			fee,
			refund,
			pk,
			&mut rng,
		),
		(Backend::Arkworks, Curve::Bls381, 5, 5) => setup_proof_x5_5::<Bls12_381, OsRng>(
			ArkCurve::Bls381,
			secrets,
			nullifier,
			leaves,
			leaf_index,
			recipient_raw,
			relayer_raw,
			fee,
			refund,
			pk,
			&mut rng,
		),
		_ => return Err(JsValue::from(OpStatusCode::InvalidProofParameters)),
	};
	Ok(Proof {
		proof,
		nullifier_hash,
		root,
	})
}
#[cfg(test)]
mod test {
	use ark_serialize::CanonicalSerialize;
	use arkworks_circuits::setup::mixer::{setup_keys_x5_5, verify_unchecked_raw};
	use js_sys::Uint8Array;
	use wasm_bindgen_test::*;

	use crate::note::JsNote;

	use super::*;

	fn verify_proof(proof: Proof, inputs: ProofInput, keys: (Vec<u8>, Vec<u8>)) -> bool {
		let vk_unchecked_bytes = keys.1;
		let proof_bytes = proof.proof.as_slice();
		let mut public_inputs: Vec<Vec<u8>> = vec![];

		let element_encoder = |v: &[u8]| {
			let mut output = [0u8; 32];
			output.iter_mut().zip(v).for_each(|(b1, b2)| *b1 = *b2);
			output
		};
		// inputs
		let recipient_bytes = inputs.recipient;
		let relayer_bytes = inputs.relayer;
		let fee_bytes = element_encoder(&inputs.fee.to_le_bytes());
		let refund_bytes = element_encoder(&inputs.refund.to_le_bytes());
		let nullifier_hash = proof.nullifier_hash;
		let root = proof.root;

		public_inputs.push(nullifier_hash);
		public_inputs.push(root);
		public_inputs.push(recipient_bytes);
		public_inputs.push(relayer_bytes);
		public_inputs.push(fee_bytes.to_vec());
		public_inputs.push(refund_bytes.to_vec());

		verify_unchecked_raw::<Bn254>(public_inputs.as_slice(), &vk_unchecked_bytes, proof_bytes)
	}
	const TREE_DEPTH: u32 = 30;
	#[wasm_bindgen_test]
	fn js_setup() {
		let (pk, vk) = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng);
		let mut pk_uncompressed_bytes = Vec::new();
		CanonicalSerialize::serialize_unchecked(&pk, &mut pk_uncompressed_bytes).unwrap();

		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let truncated_substrate_address = truncate_and_pad(&hex::decode(decoded_substrate_address).unwrap());
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();
		let mut js_builder = JsProofInputBuilder::new();
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

		let proof_input = js_builder.build().unwrap();

		assert_eq!(
			hex::encode(proof_input.recipient),
			hex::encode(&truncated_substrate_address)
		);
		assert_eq!(
			hex::encode(proof_input.relayer),
			hex::encode(&truncated_substrate_address)
		);

		assert_eq!(proof_input.refund, 1);
		assert_eq!(proof_input.fee, 5);

		assert_eq!(proof_input.leaf_index, 0);
		assert_eq!(hex::encode(proof_input.leaves[0]), hex::encode(leave_bytes));
	}

	#[wasm_bindgen_test]
	fn generate_proof() {
		let (pk, vk) = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng);

		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();
		let mut js_builder = JsProofInputBuilder::new();
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

		let proof_input = js_builder.build().unwrap();
		let proof = generate_proof_js(note, proof_input.clone()).unwrap();
		let is_valied_proof = verify_proof(proof, proof_input, (pk, vk));
		assert!(is_valied_proof);
	}

	#[wasm_bindgen_test]
	fn is_valid_merkle_root() {
		let (pk, vk) = setup_keys_x5_5::<Bn254, _>(ArkCurve::Bn254, &mut OsRng);
		let rigid_leaf = hex::decode("66b27a63d25d5187381a251ddf36c0d195f69f303826ec45e534806746549820").unwrap();
		let rigid_root = hex::decode("6caaa2fea7789832bb2df2e74921c8058e5c66e8a842fe9d389864c006e0492b").unwrap();
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();
		let mut js_builder = JsProofInputBuilder::new();
		let leave: Uint8Array = Uint8Array::from(rigid_leaf.as_slice());
		let leaves_ua: Array = vec![leave].into_iter().collect();

		js_builder.set_leaf_index(JsString::from("0"));
		js_builder.set_leaves(Leaves::from(JsValue::from(leaves_ua)));

		js_builder.set_fee(JsString::from("5"));
		js_builder.set_refund(JsString::from("1"));

		js_builder.set_relayer(JsString::from(decoded_substrate_address));
		js_builder.set_recipient(JsString::from(decoded_substrate_address));
		js_builder.set_pk(JsString::from(hex::encode(&pk)));

		let proof_input = js_builder.build().unwrap();
		let proof = generate_proof_js(note, proof_input.clone()).unwrap();
		assert_eq!(hex::encode(&proof.root.clone()), hex::encode(rigid_root));
		let is_valid_proof = verify_proof(proof, proof_input, (pk, vk));
		assert!(is_valid_proof);
	}
}
