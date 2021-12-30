use std::convert::{TryFrom, TryInto};
use std::ops::Deref;

use ark_serialize::CanonicalSerialize;
use console_error_panic_hook;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::note::secrets::generate_secrets;
use crate::note::Note;
use crate::types::{Backend, Curve as NoteCurve, HashFunction, NotePrefix, NoteVersion, OpStatusCode};

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type = "NotePrefix")]
	pub type Prefix;

	#[wasm_bindgen(typescript_type = "Curve")]
	pub type Curve;

	#[wasm_bindgen(typescript_type = "HashFunction")]
	pub type HF;

	#[wasm_bindgen(typescript_type = "Version")]
	pub type Version;

	#[wasm_bindgen(typescript_type = "Backend")]
	pub type BE;

	#[wasm_bindgen(typescript_type = "Leaves")]
	pub type Leaves;
}
#[wasm_bindgen(typescript_custom_section)]
const NOTE_PREFIX: &str = "type NotePrefix = 'webb.mixer'|'webb.bridge' ";

#[wasm_bindgen(typescript_custom_section)]
const LEAVES: &str = "type Leaves = Array<Uint8Array>;";

#[wasm_bindgen(typescript_custom_section)]
const HF: &str = "type HashFunction = 'Poseidon'|'MiMCTornado'";

#[wasm_bindgen(typescript_custom_section)]
const CURVE: &str = "type Curve = 'Bls381'|'Bn254' |'Curve25519'";

#[wasm_bindgen(typescript_custom_section)]
const VERSION: &str = "type Version = 'v1'";

#[wasm_bindgen(typescript_custom_section)]
const BE: &str = "type Backend = 'Bulletproofs'|'Arkworks'|'Circom'";

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct JsNote {
	#[wasm_bindgen(skip)]
	pub note: Note,
}

#[wasm_bindgen]
pub struct JsNoteBuilder {
	#[wasm_bindgen(skip)]
	pub prefix: Option<NotePrefix>,
	#[wasm_bindgen(skip)]
	pub version: Option<NoteVersion>,
	#[wasm_bindgen(skip)]
	pub target_chain_id: Option<String>,
	#[wasm_bindgen(skip)]
	pub source_chain_id: Option<String>,
	/// zkp related items
	#[wasm_bindgen(skip)]
	pub backend: Option<Backend>,
	#[wasm_bindgen(skip)]
	pub hash_function: Option<HashFunction>,
	#[wasm_bindgen(skip)]
	pub curve: Option<NoteCurve>,
	#[wasm_bindgen(skip)]
	pub token_symbol: Option<String>,
	#[wasm_bindgen(skip)]
	pub amount: Option<String>,
	#[wasm_bindgen(skip)]
	pub denomination: Option<u8>,
	#[wasm_bindgen(skip)]
	pub exponentiation: Option<i8>,
	#[wasm_bindgen(skip)]
	pub width: Option<usize>,
	#[wasm_bindgen(skip)]
	pub secrets: Option<Vec<u8>>,
}

impl Default for JsNoteBuilder {
	fn default() -> Self {
		Self {
			prefix: None,
			version: None,
			target_chain_id: None,
			source_chain_id: None,
			backend: None,
			hash_function: None,
			curve: None,
			token_symbol: None,
			amount: None,
			denomination: None,
			exponentiation: None,
			width: None,
			secrets: None,
		}
	}
}
#[wasm_bindgen]
impl JsNoteBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	pub fn prefix(&mut self, prefix: Prefix) {
		let prefix: String = JsValue::from(&prefix).as_string().unwrap();
		let note_prefix: NotePrefix = prefix.as_str().parse().unwrap();
		self.prefix = Some(note_prefix);
	}

	pub fn version(&mut self, version: Version) {
		let version: String = JsValue::from(&version).as_string().unwrap();
		let note_version: NoteVersion = version.as_str().parse().unwrap();
		self.version = Some(note_version);
	}

	#[wasm_bindgen(js_name = targetChainId)]
	pub fn chain_id(&mut self, target_chain_id: JsString) {
		self.target_chain_id = Some(target_chain_id.into());
	}

	#[wasm_bindgen(js_name = sourceChainId)]
	pub fn source_chain_id(&mut self, source_chain_id: JsString) {
		self.source_chain_id = Some(source_chain_id.into());
	}

	pub fn backend(&mut self, backend: BE) {
		let c: String = JsValue::from(&backend).as_string().unwrap();
		let backend: Backend = c.parse().unwrap();
		self.backend = Some(backend);
	}

	#[wasm_bindgen(js_name = hashFunction)]
	pub fn hash_function(&mut self, hash_function: HF) {
		let hash_function: String = JsValue::from(&hash_function).as_string().unwrap();
		let hash_function: HashFunction = hash_function.parse().unwrap();
		self.hash_function = Some(hash_function);
	}

	pub fn curve(&mut self, curve: Curve) {
		let curve: String = JsValue::from(&curve).as_string().unwrap();
		let curve: NoteCurve = curve.parse().unwrap();
		self.curve = Some(curve);
	}

	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&mut self, token_symbol: JsString) {
		self.token_symbol = Some(token_symbol.into());
	}

	pub fn amount(&mut self, amount: JsString) {
		self.amount = Some(amount.into());
	}

	pub fn denomination(&mut self, denomination: JsString) {
		let den: String = denomination.into();
		let denomination = den.parse().unwrap();
		self.denomination = Some(denomination);
	}

	pub fn exponentiation(&mut self, exponentiation: JsString) {
		let exp: String = exponentiation.into();
		let exponentiation = exp.parse().unwrap();
		self.exponentiation = Some(exponentiation);
	}

	pub fn width(&mut self, width: JsString) {
		let width: String = width.into();
		let width = width.parse().unwrap();
		self.width = Some(width);
	}

	#[wasm_bindgen(js_name = setSecrets)]
	pub fn set_secrets(&mut self, secrets: JsString) {
		let secrets_string: String = secrets.into();
		let sec = hex::decode(secrets_string.replace("0x", "")).unwrap();
		self.secrets = Some(sec);
	}

	pub fn build(self) -> Result<JsNote, JsValue> {
		let exponentiation = self.exponentiation.ok_or(OpStatusCode::InvalidExponentiation)?;
		let width = self.width.ok_or(OpStatusCode::InvalidWidth)?;
		let curve = self.curve.ok_or(OpStatusCode::InvalidCurve)?;

		let secret = match self.secrets {
			None => generate_secrets(exponentiation, width, curve, &mut OsRng)?,
			Some(secrets) => secrets.clone(),
		};

		let prefix = self.prefix.ok_or(OpStatusCode::InvalidNotePrefix)?;
		let version = self.version.ok_or(OpStatusCode::InvalidNoteVersion)?;
		let target_chain_id = self.target_chain_id.ok_or(OpStatusCode::InvalidTargetChain)?;
		let source_chain_id = self.source_chain_id.ok_or(OpStatusCode::InvalidSourceChain)?;
		let backend = self.backend.ok_or(OpStatusCode::InvalidBackend)?;
		let hash_function = self.hash_function.ok_or(OpStatusCode::InvalidHasFunction)?;
		let token_symbol = self.token_symbol.ok_or(OpStatusCode::InvalidTokenSymbol)?;
		let amount = self.amount.ok_or(OpStatusCode::InvalidAmount)?;
		let denomination = self.denomination.ok_or(OpStatusCode::InvalidDenomination)?;

		let note: Note = Note {
			prefix,
			version,
			target_chain_id,
			source_chain_id,
			backend,
			hash_function,
			curve,
			token_symbol,
			amount,
			denomination,
			exponentiation,
			width,
			secret,
		};
		Ok(JsNote { note })
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
impl From<NotePrefix> for JsString {
	fn from(e: NotePrefix) -> Self {
		JsString::from(e.to_string())
	}
}

#[wasm_bindgen]
impl JsNote {
	#[wasm_bindgen(constructor)]
	pub fn new(builder: JsNoteBuilder) -> Result<JsNote, JsValue> {
		builder.build()
	}

	pub fn deserialize(note: JsString) -> Result<JsNote, JsValue> {
		let n: String = note.into();
		let n = Note::deserialize(&n)?;
		Ok(JsNote { note: n })
	}

	#[wasm_bindgen(js_name = getLeafCommitment)]
	pub fn get_leaf_commitment(&self) -> Result<Uint8Array, JsValue> {
		let (leaf, ..) = self.note.get_leaf_and_nullifier()?;
		Ok(Uint8Array::from(leaf.as_slice()))
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

	#[wasm_bindgen(js_name = targetChainId)]
	#[wasm_bindgen(getter)]
	pub fn target_chain_id(&self) -> JsString {
		self.note.target_chain_id.clone().into()
	}

	#[wasm_bindgen(js_name = sourceChainId)]
	#[wasm_bindgen(getter)]
	pub fn source_chain_id(&self) -> JsString {
		self.note.source_chain_id.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> JsString {
		self.note.backend.into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = hashFunction)]
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
	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&self) -> JsString {
		self.note.token_symbol.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		self.note.amount.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn denomination(&self) -> JsString {
		let denomination = self.note.denomination.to_string();
		denomination.into()
	}

	#[wasm_bindgen(getter)]
	pub fn width(&self) -> JsString {
		let width = self.note.width.to_string();
		width.into()
	}

	#[wasm_bindgen(getter)]
	pub fn exponentiation(&self) -> JsString {
		let exp = self.note.exponentiation.to_string();
		exp.into()
	}
}

struct Uint8Arrayx32([u8; 32]);

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

#[cfg(test)]
mod tests {
	use wasm_bindgen_test::*;

	use super::*;

	wasm_bindgen_test_configure!(run_in_browser);

	#[wasm_bindgen_test]
	fn deserialize_to_js_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = JsNote::deserialize(JsString::from(note_str)).unwrap();

		assert_eq!(note.prefix(), JsString::from(NotePrefix::Bridge.to_string()));
		assert_eq!(note.version(), JsString::from(NoteVersion::V1.to_string()));
		assert_eq!(note.target_chain_id(), JsString::from("3"));
		assert_eq!(note.source_chain_id(), JsString::from("2"));

		assert_eq!(note.width(), JsString::from("5"));
		assert_eq!(note.exponentiation(), JsString::from("5"));
		assert_eq!(note.denomination(), JsString::from("18"));
		assert_eq!(note.token_symbol(), JsString::from("EDG"));

		assert_eq!(note.backend(), JsString::from(Backend::Arkworks.to_string()));
		assert_eq!(note.curve(), JsString::from(NoteCurve::Bn254.to_string()));
		assert_eq!(note.hash_function(), JsString::from(HashFunction::Poseidon.to_string()));
	}
	#[wasm_bindgen_test]
	fn serialize_js_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";

		let mut note_builder = JsNoteBuilder::new();
		let prefix: Prefix = JsValue::from(NotePrefix::Bridge.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V1.to_string()).into();
		let backend: BE = JsValue::from(Backend::Arkworks.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();

		note_builder.prefix(prefix);
		note_builder.version(version);
		note_builder.chain_id(JsString::from("3"));
		note_builder.source_chain_id(JsString::from("2"));

		note_builder.width(JsString::from("5"));
		note_builder.exponentiation(JsString::from("5"));
		note_builder.denomination(JsString::from("18"));

		note_builder.token_symbol(JsString::from("EDG"));
		note_builder.hash_function(hash_function);
		note_builder.backend(backend);
		note_builder.set_secrets(JsString::from("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717"));
		let note = note_builder.build().unwrap();
		assert_eq!(note.serialize(), JsString::from(note_str));
	}

	#[wasm_bindgen_test]
	fn generate_leaf() {
		let note = JsNote::deserialize(JsString::from("webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:WEBB:18:10:5:5:a1feeba98193583d3fb0304b456676976ff379ef54f3749419741d9b6eec2b20e059e20847ba94f6b78fcacb2e6b8b6dd1f40e65c6b0d15eb3b40a4fc600431797c787b40e6ead35527a299786411a19731ba909c3ab2e242b4abefb023f072a")).unwrap();
	}
}
#[cfg(not(test))]
#[wasm_bindgen(start)]
pub fn main() {
	console_error_panic_hook::set_once();
}
