use std::convert::{TryFrom, TryInto};

use js_sys::{Array, JsString, SharedArrayBuffer};
use wasm_bindgen::prelude::*;

use crate::note::note::{Backend, Curve as NoteCurve, HashFunction, Note, NoteBuilder, NoteVersion};
use crate::types::OpStatusCode;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type = "Curve")]
	pub type Curve;

	#[wasm_bindgen(typescript_type = "HashFunction")]
	pub type HF;

	#[wasm_bindgen(typescript_type = "Version")]
	pub type Version;

	#[wasm_bindgen(typescript_type = "Backend")]
	pub type BE;
}

#[wasm_bindgen(typescript_custom_section)]
const HF: &str = "type HashFunction = 'Poseidon3'|'Poseidon5'|'Poseidon17 '|'MiMCTornado'";

#[wasm_bindgen(typescript_custom_section)]
const CURVE: &str = "type Curve = 'Bls381'|'Bn254' |'Curve25519'";

#[wasm_bindgen(typescript_custom_section)]
const VERSION: &str = "type Version = 'v1'";

#[wasm_bindgen(typescript_custom_section)]
const BE: &str = "type Backend = 'Bulletproofs'|'Arkworks'|'Circom'";
#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct DepositNote {
	note: Note,
}

#[wasm_bindgen]
pub struct NoteBuilderInput {
	note_builder: NoteBuilder,
}

impl Default for NoteBuilderInput {
	fn default() -> Self {
		Self {
			note_builder: NoteBuilder::default(),
		}
	}
}
#[wasm_bindgen]
impl NoteBuilderInput {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	pub fn prefix(&mut self, prefix: JsString) -> () {
		self.note_builder.prefix = prefix.into();
	}

	pub fn version(&mut self, version: Version) -> () {
		let c: String = JsValue::from(&version).as_string().unwrap();
		self.note_builder.version = c.parse().unwrap();
	}

	pub fn chain(&mut self, chain: JsString) -> () {
		self.note_builder.chain = chain.into();
	}

	pub fn backend(&mut self, backend: BE) -> () {
		let c: String = JsValue::from(&backend).as_string().unwrap();
		self.note_builder.backend = c.parse().unwrap();
	}

	pub fn hash_function(&mut self, hash_function: HF) -> () {
		let c: String = JsValue::from(&hash_function).as_string().unwrap();
		self.note_builder.hash_function = c.parse().unwrap();
	}

	pub fn curve(&mut self, curve: Curve) -> () {
		let c: String = JsValue::from(&curve).as_string().unwrap();
		self.note_builder.curve = c.parse().unwrap();
	}

	pub fn token_symbol(&mut self, token_symbol: JsString) -> () {
		self.note_builder.token_symbol = token_symbol.into();
	}

	pub fn amount(&mut self, amount: JsString) -> () {
		self.note_builder.amount = amount.into();
	}

	pub fn denomination(&mut self, denomination: JsString) -> () {
		self.note_builder.denomination = denomination.into();
	}
}

impl From<OpStatusCode> for JsValue {
	fn from(e: OpStatusCode) -> Self {
		JsValue::from(e as u32)
	}
}

impl From<Backend> for JsString {
	fn from(e: Backend) -> Self {
		JsString::from(e.to_string())
	}
}

impl From<NoteCurve> for JsString {
	fn from(e: NoteCurve) -> Self {
		JsString::from(e.to_string())
	}
}

impl From<HashFunction> for JsString {
	fn from(e: HashFunction) -> Self {
		JsString::from(e.to_string())
	}
}

impl From<NoteVersion> for JsString {
	fn from(e: NoteVersion) -> Self {
		JsString::from(e.to_string())
	}
}

#[wasm_bindgen]
impl DepositNote {
	#[wasm_bindgen(constructor)]
	pub fn new(builder: NoteBuilderInput) -> Result<DepositNote, JsValue> {
		let note = builder
			.note_builder
			.generate_note()
			.map_err(|_| OpStatusCode::SecretGenFailed)?;
		Ok(DepositNote { note })
	}

	pub fn deserialize(note: JsString) -> Result<DepositNote, JsValue> {
		let n: String = note.into();
		let n = Note::deserialize(&n)?;
		Ok(DepositNote { note: n })
	}

	pub fn serialize(&self) -> JsString {
		JsString::from(self.note.to_string())
	}

	#[wasm_bindgen(getter)]
	pub fn prefix(&self) -> JsString {
		self.note.prefix.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn version(&self) -> JsString {
		self.note.version.into()
	}

	#[wasm_bindgen(getter)]
	pub fn chain(&self) -> JsString {
		self.note.chain.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> JsString {
		self.note.backend.into()
	}

	#[wasm_bindgen(getter)]
	pub fn hash_function(&self) -> JsString {
		self.note.hash_function.into()
	}

	#[wasm_bindgen(getter)]
	pub fn curve(&self) -> JsString {
		self.note.curve.into()
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
