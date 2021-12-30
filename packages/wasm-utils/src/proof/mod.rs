use std::convert::{TryFrom, TryInto};
use std::ops::Deref;

use arkworks_circuits::setup::mixer::setup_proof_x5_5;
use arkworks_utils::prelude::ark_bls12_381::Bls12_381;
use arkworks_utils::prelude::ark_bn254::Bn254;
use arkworks_utils::utils::common::Curve as ArkCurve;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::Note;
use crate::types::{Backend, Curve, OpStatusCode};
use crate::wasm::JsNote;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type = "Leaves")]
	pub type Leaves;
}

#[wasm_bindgen(typescript_custom_section)]
const LEAVES: &str = "type Leaves = Array<Uint8Array>;";
pub struct Uint8Arrayx32([u8; 32]);

impl Deref for Uint8Arrayx32 {
	type Target = [u8; 32];

	fn deref(&self) -> &Self::Target {
		&self.0
	}
}

impl TryFrom<Uint8Array> for Uint8Arrayx32 {
	type Error = OpStatusCode;

	fn try_from(value: Uint8Array) -> Result<Self, Self::Error> {
		let bytes: [u8; 32] = value
			.to_vec()
			.try_into()
			.map_err(|_| OpStatusCode::InvalidArrayLength)?;
		Ok(Self(bytes))
	}
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
#[derive(Debug, Eq, PartialEq)]
pub struct ProofInput {
	#[wasm_bindgen(skip)]
	pub recipient: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub relayer: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub leaves: Vec<[u8; 32]>,
	#[wasm_bindgen(skip)]
	pub leaf_index: u32,
	#[wasm_bindgen(skip)]
	pub fee: u32,
	#[wasm_bindgen(skip)]
	pub refund: u32,
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
	pub leaf_index: Option<u32>,
	#[wasm_bindgen(skip)]
	pub fee: Option<u32>,
	#[wasm_bindgen(skip)]
	pub refund: Option<u32>,
	#[wasm_bindgen(skip)]
	pub pk: Option<Vec<u8>>,
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
	pub fn set_recipient(&mut self, recipient: JsString) {
		let r: String = recipient.into();
		self.recipient = Some(hex::decode(r).unwrap());
	}

	#[wasm_bindgen(js_name = setRelayer)]
	pub fn set_relayer(&mut self, relayer: JsString) {
		let r: String = relayer.into();
		self.relayer = Some(hex::decode(r).unwrap());
	}

	#[wasm_bindgen(js_name = setLeaves)]
	pub fn set_leaves(&mut self, leaves: Leaves) {
		let ls: Vec<_> = Array::from(&leaves)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()
			.unwrap()
			.into_iter()
			.map(|v| v.0)
			.collect();
		self.leaves = Some(ls);
	}

	#[wasm_bindgen(js_name = setLeafIndex)]
	pub fn set_leaf_index(&mut self, leaf_index: JsString) {
		let leaf_index: String = leaf_index.into();
		let leaf_index: u32 = leaf_index.as_str().parse().unwrap();
		self.leaf_index = Some(leaf_index);
	}

	#[wasm_bindgen(js_name = setFee)]
	pub fn set_fee(&mut self, fee: JsString) {
		let fee: String = fee.into();
		let fee: u32 = fee.as_str().parse().unwrap();
		self.fee = Some(fee);
	}

	#[wasm_bindgen(js_name = setRefund)]
	pub fn set_refund(&mut self, refund: JsString) {
		let refund: String = refund.into();
		let refund: u32 = refund.as_str().parse().unwrap();
		self.refund = Some(refund);
	}

	#[wasm_bindgen(js_name = setPk)]
	pub fn set_pk(&mut self, pk: JsString) {
		let p: String = pk.into();
		self.pk = Some(hex::decode(p).unwrap());
	}

	#[wasm_bindgen]
	pub fn build(self) -> ProofInput {
		let pk = self.pk.unwrap();
		let recipient = self.recipient.unwrap();
		let relayer = self.relayer.unwrap();

		let leaf_index = self.leaf_index.unwrap();
		let leaves = self.leaves.unwrap();

		let fee = self.fee.unwrap();
		let refund = self.refund.unwrap();

		ProofInput {
			pk,
			relayer,
			recipient,
			refund,
			fee,
			leaf_index,
			leaves,
		}
	}
}

#[wasm_bindgen]
pub fn generate_proof_js(js_note: JsNote, proof_input: ProofInput) -> Proof {
	let note = js_note.note;
	let width = note.width;
	let exponentiation = note.exponentiation;
	let backend = note.backend;
	let curve = note.curve;
	let note_secrets = note.secret;
	let secrets = note_secrets[..32].to_vec();
	let nullifier = note_secrets[32..64].to_vec();
	let leaves: Vec<_> = proof_input.leaves.into_iter().map(|i| i.to_vec()).collect();
	let leaf_index = proof_input.leaf_index as u64;
	let recipient_raw = proof_input.recipient;
	let relayer_raw = proof_input.relayer;

	let fee = proof_input.fee as u128;
	let refund = proof_input.refund as u128;
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
		_ => unimplemented!(),
	};
	Proof {
		proof,
		nullifier_hash,
		root,
	}
}
#[cfg(test)]
mod test {
	use ark_serialize::CanonicalSerialize;
	use arkworks_circuits::setup::common::setup_tree_and_create_path_tree_x5;
	use arkworks_circuits::setup::mixer::setup_groth16_random_circuit_x5;
	use arkworks_utils::prelude::ark_bn254;
	use js_sys::Uint8Array;

	use crate::proof::JsProofInputBuilder;
	use crate::wasm::JsNoteBuilder;

	use super::*;

	const TREE_DEPTH: u32 = 30;
	#[test]
	fn js_setup() {
		let (pk, vk) = setup_groth16_random_circuit_x5::<_, ark_bn254::Bn254, TREE_DEPTH>(OsRng, ArkCurve::Bn254);
		let mut pk_uncompressed_bytes = Vec::new();
		CanonicalSerialize::serialize_uncompressed(&pk, &mut pk_uncompressed_bytes).unwrap();

		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let decoded_substrate_address = "644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129";
		let note = JsNote::deserialize(JsString::from(note_str)).unwrap();
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

		js_builder.set_pk(JsString::from(hex::encode(pk_uncompressed_bytes.clone())));

		let proof_input = js_builder.build();

		assert_eq!(hex::encode(proof_input.recipient), decoded_substrate_address);
		assert_eq!(hex::encode(proof_input.relayer), decoded_substrate_address);

		assert_eq!(proof_input.refund, 1);
		assert_eq!(proof_input.fee, 5);

		assert_eq!(proof_input.leaf_index, 0);
		assert_eq!(hex::encode(proof_input.leaves[0]), hex::encode(leave_bytes));

		assert_eq!(hex::encode(proof_input.pk), hex::encode(pk_uncompressed_bytes))
	}
}
