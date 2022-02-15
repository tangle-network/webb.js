use arkworks_circuits::setup::common::Leaf;
use core::fmt;
use std::str::FromStr;

use js_sys::{JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use crate::types::{
	Backend, Curve, HashFunction, NotePrefix, NoteVersion, OpStatusCode, OperationError, Prefix, Version, WasmCurve,
	BE, HF,
};

mod anchor;
pub mod mixer;

impl JsNote {
	/// Deseralize note from a string
	pub fn deserialize(note: &str) -> Result<Self, OpStatusCode> {
		note.parse().map_err(Into::into)
	}

	pub fn get_leaf_and_nullifier(&self) -> Result<Leaf, OperationError> {
		match self.prefix {
			NotePrefix::Mixer => {
				mixer::get_leaf_with_private_raw(self.curve, self.width, self.exponentiation, &self.secret)
			}
			NotePrefix::Anchor => anchor::get_leaf_with_private_raw(
				self.curve,
				self.width,
				self.exponentiation,
				&self.secret,
				self.target_chain_id.parse().unwrap(),
			),
			_ => {
				let message = format!("{} prefix isn't supported yet", self.prefix);
				Err(OperationError::new_with_message(
					OpStatusCode::FailedToGenerateTheLeaf,
					message,
				))
			}
		}
	}
}

impl fmt::Display for JsNote {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		let secrets = hex::encode(&self.secret);
		let parts: Vec<String> = vec![
			//0 => prefix
			self.prefix.to_string(),
			//1 => version
			self.version.to_string(),
			//2 => chain
			self.target_chain_id.to_string(),
			//3 => chain
			self.source_chain_id.to_string(),
			//4 => backend
			self.backend.to_string(),
			//5 => curve
			self.curve.to_string(),
			//6 => hash_function
			self.hash_function.to_string(),
			//7 => token_symbol
			self.token_symbol.clone(),
			//8 => denomination
			self.denomination.to_string(),
			//9 => amount
			self.amount.clone(),
			// 10
			self.exponentiation.to_string(),
			// 11
			self.width.to_string(),
			//12
			secrets,
		];
		let note = parts.join(":");
		write!(f, "{}", note)
	}
}

impl FromStr for JsNote {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		let parts: Vec<&str> = s.split(':').collect();
		let prefix = parts[0].parse()?;
		let version: NoteVersion = parts[1].parse()?;
		let target_chain_id = parts[2].to_string();
		let source_chain_id = parts[3].to_string();
		let backend: Backend = parts[4].parse()?;
		let curve: Curve = parts[5].parse()?;
		let hash_function: HashFunction = parts[6].parse()?;
		let token_symbol = parts[7].to_owned();
		let denomination = parts[8].parse().unwrap();
		let amount = parts[9].to_string();
		let exponentiation = parts[10].parse().unwrap();
		let width = parts[11].parse().unwrap();
		let note_val = parts[12];

		if note_val.is_empty() {
			return Err(OpStatusCode::InvalidNoteSecrets);
		}
		let secret: Vec<u8> = hex::decode(&note_val.replace("0x", "")).map_err(|_| OpStatusCode::HexParsingFailed)?;

		Ok(JsNote {
			prefix,
			version,
			target_chain_id,
			source_chain_id,
			token_symbol,
			curve,
			hash_function,
			backend,
			denomination,
			amount,
			exponentiation,
			width,
			secret,
		})
	}
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct JsNote {
	#[wasm_bindgen(skip)]
	pub prefix: NotePrefix,
	#[wasm_bindgen(skip)]
	pub version: NoteVersion,
	#[wasm_bindgen(skip)]
	pub target_chain_id: String,
	#[wasm_bindgen(skip)]
	pub source_chain_id: String,

	/// zkp related items
	#[wasm_bindgen(skip)]
	pub backend: Backend,
	#[wasm_bindgen(skip)]
	pub hash_function: HashFunction,
	#[wasm_bindgen(skip)]
	pub curve: Curve,
	#[wasm_bindgen(skip)]
	pub exponentiation: i8,
	#[wasm_bindgen(skip)]
	pub width: usize,
	/// mixer related items
	#[wasm_bindgen(skip)]
	pub secret: Vec<u8>,

	#[wasm_bindgen(skip)]
	pub token_symbol: String,
	#[wasm_bindgen(skip)]
	pub amount: String,
	#[wasm_bindgen(skip)]
	pub denomination: u8,
}

#[wasm_bindgen]
#[derive(Default)]
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
	pub curve: Option<Curve>,
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

#[wasm_bindgen]
impl JsNoteBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	pub fn prefix(&mut self, prefix: Prefix) -> Result<(), JsValue> {
		let prefix: String = JsValue::from(&prefix)
			.as_string()
			.ok_or(OpStatusCode::InvalidNotePrefix)?;
		let note_prefix: NotePrefix = prefix.as_str().parse().map_err(|_| OpStatusCode::InvalidNotePrefix)?;
		self.prefix = Some(note_prefix);
		Ok(())
	}

	pub fn version(&mut self, version: Version) -> Result<(), JsValue> {
		let version: String = JsValue::from(&version)
			.as_string()
			.ok_or(OpStatusCode::InvalidNoteVersion)?;
		let note_version: NoteVersion = version.as_str().parse().map_err(|_| OpStatusCode::InvalidNotePrefix)?;
		self.version = Some(note_version);
		Ok(())
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
	pub fn hash_function(&mut self, hash_function: HF) -> Result<(), JsValue> {
		let hash_function: String = JsValue::from(&hash_function)
			.as_string()
			.ok_or(OpStatusCode::InvalidHasFunction)?;
		let hash_function: HashFunction = hash_function.parse().map_err(|_| OpStatusCode::InvalidHasFunction)?;
		self.hash_function = Some(hash_function);
		Ok(())
	}

	pub fn curve(&mut self, curve: WasmCurve) -> Result<(), JsValue> {
		let curve: String = JsValue::from(&curve).as_string().ok_or(OpStatusCode::InvalidCurve)?;
		let curve: Curve = curve.parse().map_err(|_| OpStatusCode::InvalidCurve)?;
		self.curve = Some(curve);
		Ok(())
	}

	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&mut self, token_symbol: JsString) {
		self.token_symbol = Some(token_symbol.into());
	}

	pub fn amount(&mut self, amount: JsString) {
		self.amount = Some(amount.into());
	}

	pub fn denomination(&mut self, denomination: JsString) -> Result<(), JsValue> {
		let den: String = denomination.into();
		let denomination = den.parse().map_err(|_| OpStatusCode::InvalidDenomination)?;
		self.denomination = Some(denomination);
		Ok(())
	}

	pub fn exponentiation(&mut self, exponentiation: JsString) -> Result<(), JsValue> {
		let exp: String = exponentiation.into();
		let exponentiation = exp.parse().map_err(|_| OpStatusCode::InvalidExponentiation)?;
		self.exponentiation = Some(exponentiation);
		Ok(())
	}

	pub fn width(&mut self, width: JsString) -> Result<(), JsValue> {
		let width: String = width.into();
		let width = width.parse().map_err(|_| OpStatusCode::InvalidWidth)?;
		self.width = Some(width);
		Ok(())
	}

	#[wasm_bindgen(js_name = setSecrets)]
	pub fn set_secrets(&mut self, secrets: JsString) -> Result<(), JsValue> {
		let secrets_string: String = secrets.into();
		let sec = hex::decode(secrets_string.replace("0x", "")).map_err(|_| OpStatusCode::InvalidNoteSecrets)?;
		self.secrets = Some(sec);
		Ok(())
	}

	pub fn build(self) -> Result<JsNote, JsValue> {
		let exponentiation = self.exponentiation.ok_or(OpStatusCode::InvalidExponentiation)?;
		let width = self.width.ok_or(OpStatusCode::InvalidWidth)?;
		let curve = self.curve.ok_or(OpStatusCode::InvalidCurve)?;
		let prefix = self.prefix.ok_or(OpStatusCode::InvalidNotePrefix)?;
		let target_chain_id = self.target_chain_id.ok_or(OpStatusCode::InvalidTargetChain)?;
		let chain_id: u128 = target_chain_id.parse().map_err(|_| OpStatusCode::InvalidTargetChain)?;

		let secret = match self.secrets {
			None => match prefix {
				NotePrefix::Mixer => mixer::generate_secrets(exponentiation, width, curve, &mut OsRng)?,
				NotePrefix::Anchor => anchor::generate_secrets(exponentiation, width, curve, chain_id, &mut OsRng)?,
				_ => return Err(JsValue::from(OpStatusCode::SecretGenFailed)),
			},
			Some(secrets) => secrets,
		};

		let version = self.version.ok_or(OpStatusCode::InvalidNoteVersion)?;
		let source_chain_id = self.source_chain_id.ok_or(OpStatusCode::InvalidSourceChain)?;
		let backend = self.backend.ok_or(OpStatusCode::InvalidBackend)?;
		let hash_function = self.hash_function.ok_or(OpStatusCode::InvalidHasFunction)?;
		let token_symbol = self.token_symbol.ok_or(OpStatusCode::InvalidTokenSymbol)?;
		let amount = self.amount.ok_or(OpStatusCode::InvalidAmount)?;
		let denomination = self.denomination.ok_or(OpStatusCode::InvalidDenomination)?;

		let note = JsNote {
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
		Ok(note)
	}
}

#[wasm_bindgen]
impl JsNote {
	#[wasm_bindgen(constructor)]
	pub fn new(builder: JsNoteBuilder) -> Result<JsNote, JsValue> {
		builder.build()
	}

	#[wasm_bindgen(js_name = deserialize)]
	pub fn js_deserialize(note: JsString) -> Result<JsNote, JsValue> {
		let n: String = note.into();
		let n = JsNote::deserialize(&n)?;
		Ok(n)
	}

	#[wasm_bindgen(js_name = getLeafCommitment)]
	pub fn get_leaf_commitment(&self) -> Result<Uint8Array, JsValue> {
		let leaf_and_nullifier = self.get_leaf_and_nullifier()?;
		Ok(Uint8Array::from(leaf_and_nullifier.leaf_bytes.as_slice()))
	}

	pub fn serialize(&self) -> JsString {
		JsString::from(self.to_string())
	}

	#[wasm_bindgen(getter)]
	pub fn prefix(&self) -> Prefix {
		self.prefix.into()
	}

	#[wasm_bindgen(getter)]
	pub fn version(&self) -> Version {
		self.version.into()
	}

	#[wasm_bindgen(js_name = targetChainId)]
	#[wasm_bindgen(getter)]
	pub fn target_chain_id(&self) -> JsString {
		self.target_chain_id.clone().into()
	}

	#[wasm_bindgen(js_name = sourceChainId)]
	#[wasm_bindgen(getter)]
	pub fn source_chain_id(&self) -> JsString {
		self.source_chain_id.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> BE {
		self.backend.into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = hashFunction)]
	pub fn hash_function(&self) -> JsString {
		self.hash_function.into()
	}

	#[wasm_bindgen(getter)]
	pub fn curve(&self) -> WasmCurve {
		self.curve.into()
	}

	#[wasm_bindgen(getter)]
	pub fn secret(&self) -> JsString {
		let secret = hex::encode(&self.secret);
		secret.into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&self) -> JsString {
		self.token_symbol.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		self.amount.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn denomination(&self) -> JsString {
		let denomination = self.denomination.to_string();
		denomination.into()
	}

	#[wasm_bindgen(getter)]
	pub fn width(&self) -> JsString {
		let width = self.width.to_string();
		width.into()
	}

	#[wasm_bindgen(getter)]
	pub fn exponentiation(&self) -> JsString {
		let exp = self.exponentiation.to_string();
		exp.into()
	}
}

#[cfg(test)]
mod test {
	use arkworks_circuits::prelude::ark_bn254;
	use wasm_bindgen_test::*;

	use crate::utils::to_rust_string;

	use super::*;

	type Bn254Fr = ark_bn254::Fr;
	#[test]
	fn deserialize() {
		let note = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = JsNote::deserialize(note).unwrap();
		assert_eq!(note.prefix, NotePrefix::Bridge);
		assert_eq!(note.backend, Backend::Arkworks);
		assert_eq!(note.curve, Curve::Bn254);
		assert_eq!(note.hash_function, HashFunction::Poseidon);
		assert_eq!(note.token_symbol, String::from("EDG"));
		assert_eq!(note.denomination, 18);
		assert_eq!(note.version, NoteVersion::V1);
		assert_eq!(note.width, 5);
		assert_eq!(note.exponentiation, 5);
		assert_eq!(note.target_chain_id, "3".to_string());
		assert_eq!(note.source_chain_id, "2".to_string());
	}

	#[test]
	fn generate_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note_value = hex::decode("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717").unwrap();
		let note = JsNote {
			prefix: NotePrefix::Bridge,
			version: NoteVersion::V1,
			target_chain_id: "3".to_string(),
			source_chain_id: "2".to_string(),
			width: 5,
			exponentiation: 5,
			denomination: 18,
			token_symbol: "EDG".to_string(),
			hash_function: HashFunction::Poseidon,
			backend: Backend::Arkworks,
			curve: Curve::Bn254,
			amount: "0".to_string(),
			secret: note_value,
		};
		assert_eq!(note.to_string(), note_str)
	}
	#[test]
	fn generate_leaf() {}

	#[wasm_bindgen_test]
	fn deserialize_to_js_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();

		assert_eq!(to_rust_string(note.prefix()), NotePrefix::Bridge.to_string());
		assert_eq!(to_rust_string(note.version()), NoteVersion::V1.to_string());
		assert_eq!(note.target_chain_id(), JsString::from("3"));
		assert_eq!(note.source_chain_id(), JsString::from("2"));

		assert_eq!(note.width(), JsString::from("5"));
		assert_eq!(note.exponentiation(), JsString::from("5"));
		assert_eq!(note.denomination(), JsString::from("18"));
		assert_eq!(note.token_symbol(), JsString::from("EDG"));

		assert_eq!(to_rust_string(note.backend()), Backend::Arkworks.to_string());
		assert_eq!(to_rust_string(note.curve()), Curve::Bn254.to_string());
		assert_eq!(to_rust_string(note.hash_function()), HashFunction::Poseidon.to_string());
	}

	#[wasm_bindgen_test]
	fn serialize_js_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";

		let mut note_builder = JsNoteBuilder::new();
		let prefix: Prefix = JsValue::from(NotePrefix::Bridge.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V1.to_string()).into();
		let backend: BE = JsValue::from(Backend::Arkworks.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();
		let curve: WasmCurve = JsValue::from(Curve::Bn254.to_string()).into();

		note_builder.prefix(prefix).unwrap();
		note_builder.version(version).unwrap();
		note_builder.chain_id(JsString::from("3"));
		note_builder.source_chain_id(JsString::from("2"));

		note_builder.width(JsString::from("5")).unwrap();
		note_builder.exponentiation(JsString::from("5")).unwrap();
		note_builder.denomination(JsString::from("18")).unwrap();
		note_builder.amount(JsString::from("0"));
		note_builder.token_symbol(JsString::from("EDG"));
		note_builder.curve(curve).unwrap();
		note_builder.hash_function(hash_function).unwrap();
		note_builder.backend(backend);
		note_builder.set_secrets(JsString::from("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717")).unwrap();
		let note = note_builder.build().unwrap();
		assert_eq!(note.serialize(), JsString::from(note_str));
	}
}
