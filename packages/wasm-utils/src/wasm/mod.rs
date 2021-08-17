use js_sys::{Array, JsString, SharedArrayBuffer};
use wasm_bindgen::prelude::*;

use crate::note::note::Note;
use crate::types::OpStatusCode;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

extern "C" {}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct DepositNote {
	note: Note,
}

impl From<OpStatusCode> for JsValue {
	fn from(e: OpStatusCode) -> Self {
		JsValue::from(e as u32)
	}
}

#[wasm_bindgen]
impl DepositNote {
	pub fn deserialize(note: JsString) -> Result<DepositNote, JsValue> {
		let n: String = note.into();
		let n = Note::deserialize(&n)?;
		Ok(DepositNote { note: n })
	}

	#[wasm_bindgen(getter)]
	pub fn prefix(&self) -> JsString {
		self.note.prefix.to_string().into()
	}

	#[wasm_bindgen(getter)]
	pub fn version(&self) -> JsString {
		self.note.version.to_string().into()
	}

	#[wasm_bindgen(getter)]
	pub fn chain(&self) -> JsString {
		self.note.chain.to_string().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> JsString {
		self.note.backend.to_string().into()
	}

	#[wasm_bindgen(getter)]
	pub fn hash_function(&self) -> JsString {
		self.note.hash_function.to_string().into()
	}

	#[wasm_bindgen(getter)]
	pub fn curve(&self) -> JsString {
		self.note.curve.to_string().into()
	}

	#[wasm_bindgen(getter)]
	pub fn secret(&self) -> JsString {
		let secret = hex::encode(&self.note.secret);
		secret.into()
	}

	#[wasm_bindgen(getter)]
	pub fn token_symbol(&self) -> JsString {
		self.note.token_symbol.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		self.note.amount.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn denomination(&self) -> JsString {
		self.note.denomination.clone().into()
	}
}
