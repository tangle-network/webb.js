use std::convert::{TryFrom, TryInto};
use std::ops::Deref;

use js_sys::{Array, JsString, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::note::Note;
use crate::types::OpStatusCode;
use crate::wasm::JsNote;
use arkworks_circuits::setup::mixer::Leaf_x5;

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
	pub note: Note,
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
	pub note: Option<JsNote>,
	#[wasm_bindgen(skip)]
	pub pk: Option<Vec<u8>>,
}

#[wasm_bindgen]
impl JsProofInputBuilder {
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

	#[wasm_bindgen(js_name = setNote)]
	pub fn set_note(&mut self, note: JsNote) {
		self.note = Some(note);
	}

	#[wasm_bindgen(js_name = setPk)]
	pub fn set_pk(&mut self, pk: JsString) {
		let p: String = pk.into();
		self.pk = Some(hex::decode(p).unwrap());
	}
}

#[wasm_bindgen]
pub fn generate_proof_js(note: JsNote, proof_input: ProofInput) -> Proof {
	// Get the values from note and proof_input and convert them to rust types
	// Call generate_proof from arkworks gadgets repo which returns proof
	// (Vec<u8u>), nullified (Vec<u8>), root (Vec<u8>)
	unimplemented!();
}
#[cfg(test)]
mod test {}
