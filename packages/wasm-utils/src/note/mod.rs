use core::fmt;
use std::str::FromStr;

use arkworks_setups::common::Leaf;
use js_sys::{JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use crate::types::{
	Backend, Curve, HashFunction, NoteProtocol, NoteVersion, OpStatusCode, OperationError, Protocol, Version,
	WasmCurve, BE, HF,
};
use crate::utxo::JsUtxo;

mod anchor;
pub mod mixer;

mod vanchor;
mod versioning;

#[allow(unused_macros)]
macro_rules! console_log {
	// Note that this is using the `log` function imported above during
	// `bare_bones`
	($($t:tt)*) => (crate::types::log(&format_args!($($t)*).to_string()))
}

pub enum JsLeafInner {
	Mixer(Leaf),
	Anchor(Leaf),
	VAnchor(JsUtxo),
}
#[wasm_bindgen]
pub struct JsLeaf {
	#[wasm_bindgen(skip)]
	pub inner: JsLeafInner,
}

#[wasm_bindgen]
impl JsLeaf {
	#[wasm_bindgen(getter)]
	pub fn protocol(&self) -> Protocol {
		let protocol = match self.inner {
			JsLeafInner::Mixer(_) => "mixer",
			JsLeafInner::Anchor(_) => "anchor",
			JsLeafInner::VAnchor(_) => "vanchor",
		};

		JsValue::from(protocol).into()
	}

	#[wasm_bindgen(getter)]
	pub fn commitment(&self) -> Uint8Array {
		match &self.inner {
			JsLeafInner::Mixer(mixer_leaf) => Uint8Array::from(mixer_leaf.secret_bytes.as_slice()),
			JsLeafInner::Anchor(anchor_leaf) => Uint8Array::from(anchor_leaf.secret_bytes.as_slice()),
			JsLeafInner::VAnchor(vanchor_leaf) => vanchor_leaf.commitment(),
		}
	}
}
impl JsNote {
	/// Deseralize note from a string
	pub fn deserialize(note: &str) -> Result<Self, OperationError> {
		note.parse().map_err(Into::into)
	}

	pub fn get_leaf_and_nullifier(&self) -> Result<JsLeaf, OperationError> {
		match self.protocol {
			NoteProtocol::Mixer => {
				let raw = match self.version {
					NoteVersion::V1 => {
						let mut raw = Vec::new();
						raw.extend_from_slice(&self.secrets[0][..]);
						raw
					}
					NoteVersion::V2 => {
						let mut raw = Vec::new();
						raw.extend_from_slice(&self.secrets[0][..]);
						raw.extend_from_slice(&self.secrets[1][..]);
						raw
					}
				};

				let mixer_leaf = mixer::get_leaf_with_private_raw(
					self.curve.unwrap_or(Curve::Bn254),
					self.width.unwrap_or(5),
					self.exponentiation.unwrap_or(5),
					&raw,
				)?;

				Ok(JsLeaf {
					inner: JsLeafInner::Mixer(mixer_leaf),
				})
			}
			NoteProtocol::Anchor => {
				let mut secret_bytes: Vec<u8> = Vec::new();
				let mut nullifier_bytes: Vec<u8> = Vec::new();
				let valid_note: bool = match self.version {
					NoteVersion::V1 => {
						if self.secrets.len() == 1 && self.secrets[0].len() == 64 {
							secret_bytes = self.secrets[0][0..32].to_vec();
							nullifier_bytes = self.secrets[0][32..64].to_vec();
							true
						} else {
							false
						}
					}
					NoteVersion::V2 => {
						if self.secrets.len() == 3 {
							nullifier_bytes = self.secrets[1].clone();
							secret_bytes = self.secrets[2].clone();
							nullifier_bytes.len() == 32 && secret_bytes.len() == 32
						} else {
							false
						}
					}
				};

				if !valid_note {
					let message = format!("Invalid secret format for protocol {}", self.protocol);
					return Err(OperationError::new_with_message(
						OpStatusCode::InvalidNoteSecrets,
						message,
					));
				}

				let anchor_leaf = anchor::get_leaf_with_private_raw(
					self.curve.unwrap_or(Curve::Bn254),
					self.width.unwrap_or(5),
					self.exponentiation.unwrap_or(4),
					u64::from_str(&self.target_chain_id).unwrap(),
					nullifier_bytes,
					secret_bytes,
				)?;

				Ok(JsLeaf {
					inner: JsLeafInner::Anchor(anchor_leaf),
				})
			}
			NoteProtocol::VAnchor => match self.version {
				NoteVersion::V1 => {
					let message = "VAnchor protocol isn't supported in note v1".to_string();
					Err(OperationError::new_with_message(
						OpStatusCode::FailedToGenerateTheLeaf,
						message,
					))
				}
				NoteVersion::V2 => {
					if self.secrets.len() == 5 {
						let chain_id = self.secrets[0].clone();

						let amount = self.secrets[1].clone();
						let blinding = self.secrets[2].clone();
						let secret_key = self.secrets[3].clone();
						let index = self.secrets[4].clone();

						let mut index_slice = [0u8; 8];
						index_slice.copy_from_slice(index.as_slice());
						let index = u64::from_le_bytes(index_slice);

						let mut amount_slice = [0u8; 16];
						amount_slice.copy_from_slice(amount.as_slice());
						let amount = u128::from_le_bytes(amount_slice);

						let mut chain_id_slice = [0u8; 8];
						chain_id_slice.copy_from_slice(chain_id.as_slice());
						let chain_id = u64::from_le_bytes(chain_id_slice);

						let curve = self.curve.unwrap_or(Curve::Bn254);
						let width = self.width.unwrap_or(2);
						let exponentiation = self.exponentiation.unwrap_or(5);

						let utxo = vanchor::get_leaf_with_private_raw(
							curve,
							width,
							exponentiation,
							secret_key.as_slice(),
							blinding.as_slice(),
							chain_id,
							amount,
							Some(index),
						)?;

						Ok(JsLeaf {
							inner: JsLeafInner::VAnchor(utxo),
						})
					} else {
						let message = format!("Invalid secret format for protocol {}", self.protocol);
						Err(OperationError::new_with_message(
							OpStatusCode::InvalidNoteSecrets,
							message,
						))
					}
				}
			},
		}
	}
}

impl fmt::Display for JsNote {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		// Note URI scheme
		let scheme = "webb://";
		// Note URI authority
		let authority = vec![self.version.to_string(), self.protocol.to_string()].join(":");
		// Note URI chain IDs
		let chain_ids = vec![self.source_chain_id.to_string(), self.target_chain_id.to_string()].join(":");
		// Note URI chain identifying data (smart contracts, tree IDs)
		let chain_identifying_data = vec![
			self.source_identifying_data.to_string(),
			self.target_identifying_data.to_string(),
		]
		.join(":");

		let secrets = &self.secrets.iter().map(hex::encode).collect::<Vec<String>>().join(":");

		// Note URI miscellaneous queries
		#[allow(clippy::map_clone)]
		let misc_values = vec![
			if self.curve.is_some() {
				format!("curve={}", self.curve.unwrap())
			} else {
				"".to_string()
			},
			if self.width.is_some() {
				format!("width={}", self.width.unwrap())
			} else {
				"".to_string()
			},
			if self.exponentiation.is_some() {
				format!("exp={}", self.exponentiation.unwrap())
			} else {
				"".to_string()
			},
			if self.hash_function.is_some() {
				format!("hf={}", self.hash_function.unwrap())
			} else {
				"".to_string()
			},
			if self.backend.is_some() {
				format!("backend={}", self.backend.unwrap())
			} else {
				"".to_string()
			},
			if self.token_symbol.is_some() {
				format!("token={}", self.token_symbol.clone().unwrap())
			} else {
				"".to_string()
			},
			if self.denomination.is_some() {
				format!("denom={}", self.denomination.unwrap())
			} else {
				"".to_string()
			},
			if self.amount.is_some() {
				format!("amount={}", self.amount.clone().unwrap())
			} else {
				"".to_string()
			},
		]
		.iter()
		.filter(|v| !v.is_empty())
		.map(|v| v.clone())
		.collect::<Vec<String>>()
		.join("&");
		// Note URI queries are prefixed with `?`
		let misc = vec!["?".to_string(), misc_values].join("");

		let parts: Vec<String> = vec![authority, chain_ids, chain_identifying_data, secrets.to_string(), misc];
		// Join the parts with `/` and connect to the scheme as is
		let note = vec![scheme.to_string(), parts.join("/")].join("");
		write!(f, "{}", note)
	}
}

impl FromStr for JsNote {
	type Err = OperationError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		if !s.contains("://") {
			versioning::v1::note_from_str(s)
		} else {
			versioning::v2::note_from_str(s)
		}
	}
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq, Clone)]
pub struct JsNote {
	#[wasm_bindgen(skip)]
	pub scheme: String,
	#[wasm_bindgen(skip)]
	pub protocol: NoteProtocol,
	#[wasm_bindgen(skip)]
	pub version: NoteVersion,
	#[wasm_bindgen(skip)]
	pub source_chain_id: String,
	#[wasm_bindgen(skip)]
	pub target_chain_id: String,
	#[wasm_bindgen(skip)]
	pub source_identifying_data: String,
	#[wasm_bindgen(skip)]
	pub target_identifying_data: String,

	/// mixer related items
	#[wasm_bindgen(skip)]
	pub secrets: Vec<Vec<u8>>,

	/// Misc - zkp related items
	#[wasm_bindgen(skip)]
	pub curve: Option<Curve>,
	#[wasm_bindgen(skip)]
	pub exponentiation: Option<i8>,
	#[wasm_bindgen(skip)]
	pub width: Option<usize>,

	#[wasm_bindgen(skip)]
	pub token_symbol: Option<String>,
	#[wasm_bindgen(skip)]
	pub amount: Option<String>,
	#[wasm_bindgen(skip)]
	pub denomination: Option<u8>,

	#[wasm_bindgen(skip)]
	pub backend: Option<Backend>,
	#[wasm_bindgen(skip)]
	pub hash_function: Option<HashFunction>,
}

#[wasm_bindgen]
#[derive(Default)]
pub struct JsNoteBuilder {
	#[wasm_bindgen(skip)]
	pub protocol: Option<NoteProtocol>,
	#[wasm_bindgen(skip)]
	pub version: Option<NoteVersion>,
	#[wasm_bindgen(skip)]
	pub source_chain_id: Option<String>,
	#[wasm_bindgen(skip)]
	pub target_chain_id: Option<String>,
	#[wasm_bindgen(skip)]
	pub source_identifying_data: Option<String>,
	#[wasm_bindgen(skip)]
	pub target_identifying_data: Option<String>,

	#[wasm_bindgen(skip)]
	pub amount: Option<String>,
	#[wasm_bindgen(skip)]
	pub denomination: Option<u8>,
	#[wasm_bindgen(skip)]
	pub secrets: Option<Vec<Vec<u8>>>,

	// Misc - zkp related items
	#[wasm_bindgen(skip)]
	pub backend: Option<Backend>,
	#[wasm_bindgen(skip)]
	pub hash_function: Option<HashFunction>,
	#[wasm_bindgen(skip)]
	pub curve: Option<Curve>,
	#[wasm_bindgen(skip)]
	pub token_symbol: Option<String>,
	#[wasm_bindgen(skip)]
	pub exponentiation: Option<i8>,
	#[wasm_bindgen(skip)]
	pub width: Option<usize>,
	// Utxo index
	#[wasm_bindgen(skip)]
	pub index: Option<u64>,
}

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
impl JsNoteBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	pub fn protocol(&mut self, protocol: Protocol) -> Result<(), JsValue> {
		let protocol: String = JsValue::from(&protocol)
			.as_string()
			.ok_or(OpStatusCode::InvalidNoteProtocol)?;
		let note_protocol: NoteProtocol = protocol
			.as_str()
			.parse()
			.map_err(|_| OpStatusCode::InvalidNoteProtocol)?;
		self.protocol = Some(note_protocol);
		Ok(())
	}

	pub fn version(&mut self, version: Version) -> Result<(), JsValue> {
		let version: String = JsValue::from(&version)
			.as_string()
			.ok_or(OpStatusCode::InvalidNoteVersion)?;
		let note_version: NoteVersion = version.as_str().parse().map_err(|_| OpStatusCode::InvalidNoteVersion)?;
		self.version = Some(note_version);
		Ok(())
	}

	#[wasm_bindgen(js_name = sourceChainId)]
	pub fn source_chain_id(&mut self, source_chain_id: JsString) {
		self.source_chain_id = Some(source_chain_id.into());
	}

	#[wasm_bindgen(js_name = targetChainId)]
	pub fn target_chain_id(&mut self, target_chain_id: JsString) {
		self.target_chain_id = Some(target_chain_id.into());
	}

	#[wasm_bindgen(js_name = sourceIdentifyingData)]
	pub fn source_identifying_data(&mut self, source_identifying_data: JsString) {
		self.source_identifying_data = Some(source_identifying_data.into());
	}

	#[wasm_bindgen(js_name = targetIdentifyingData)]
	pub fn target_identifying_data(&mut self, target_identifying_data: JsString) {
		self.target_identifying_data = Some(target_identifying_data.into());
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

	pub fn index(&mut self, index: JsString) -> Result<(), JsValue> {
		let index: String = index.into();
		let index: u64 = index.parse().map_err(|_| OpStatusCode::InvalidUTXOIndex)?;
		self.index = Some(index);
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
		let secrets_parts: Vec<String> = secrets_string.split(':').map(String::from).collect();
		let secs = secrets_parts
			.iter()
			.map(|v| hex::decode(v.replace("0x", "")).unwrap_or_default())
			.collect();
		self.secrets = Some(secs);
		Ok(())
	}

	pub fn build(self) -> Result<JsNote, JsValue> {
		// Authority
		let version = self.version.ok_or(OpStatusCode::InvalidNoteVersion)?;
		let protocol = self.protocol.ok_or(OpStatusCode::InvalidNoteProtocol)?;

		// Chain Ids
		let source_chain_id = self.source_chain_id.ok_or(OpStatusCode::InvalidSourceChain)?;
		let _: u64 = source_chain_id.parse().map_err(|_| OpStatusCode::InvalidSourceChain)?;
		let target_chain_id = self.target_chain_id.ok_or(OpStatusCode::InvalidTargetChain)?;
		let chain_id: u64 = target_chain_id.parse().map_err(|_| OpStatusCode::InvalidTargetChain)?;

		// Chain identifying data
		let source_identifying_data = self.source_identifying_data.ok_or_else(|| source_chain_id.clone())?;
		let target_identifying_data = self.target_identifying_data.ok_or_else(|| target_chain_id.clone())?;

		// Misc
		let exponentiation = self.exponentiation;
		let width = self.width;
		let curve = self.curve;
		let amount = self.amount.clone();
		let index = self.index;
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		if backend == Backend::Circom && self.secrets.is_none() {
			let message = "Circom backend is supported when the secret value is supplied".to_string();
			let operation_error = OperationError::new_with_message(OpStatusCode::UnsupportedBackend, message);
			return Err(operation_error.into());
		}

		let secrets = match self.secrets {
			None => match protocol {
				NoteProtocol::Mixer => {
					let secrets = mixer::generate_secrets(
						exponentiation.unwrap_or(5),
						width.unwrap_or(5),
						curve.unwrap_or(Curve::Bn254),
						&mut OsRng,
					)?;

					secrets.to_vec()
				}
				NoteProtocol::Anchor => {
					let secrets = anchor::generate_secrets(
						exponentiation.unwrap_or(5),
						width.unwrap_or(4),
						curve.unwrap_or(Curve::Bn254),
						chain_id,
						&mut OsRng,
					)?;

					secrets.to_vec()
				}
				NoteProtocol::VAnchor => {
					let utxo = vanchor::generate_secrets(
						amount.unwrap_or_else(|| "0".to_string()).parse().unwrap(),
						exponentiation.unwrap_or(5),
						width.unwrap_or(5),
						curve.unwrap_or(Curve::Bn254),
						chain_id,
						index,
						&mut OsRng,
					)?;

					let chain_id = utxo.get_chain_id_bytes();
					let amount = utxo.get_amount();
					let blinding = utxo.get_blinding();
					let secret_key = utxo.get_secret_key();
					let index = utxo.get_index_bytes();

					// secrets
					vec![chain_id, amount, blinding, secret_key, index]
				}
			},
			Some(secrets) => secrets,
		};

		let backend = self.backend;
		let hash_function = self.hash_function;
		let token_symbol = self.token_symbol;
		let amount = self.amount.clone();
		let denomination = self.denomination;

		let scheme = "webb://".to_string();
		let note = JsNote {
			scheme,
			protocol,
			version,
			source_chain_id,
			target_chain_id,
			source_identifying_data,
			target_identifying_data,
			backend,
			hash_function,
			curve,
			token_symbol,
			amount,
			denomination,
			exponentiation,
			width,
			secrets,
		};
		Ok(note)
	}
}

#[allow(clippy::unused_unit)]
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
		let leaf = self.get_leaf_and_nullifier()?;

		Ok(leaf.commitment())
	}

	pub fn serialize(&self) -> JsString {
		JsString::from(self.to_string())
	}

	#[wasm_bindgen(getter)]
	pub fn protocol(&self) -> Protocol {
		self.protocol.into()
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

	#[wasm_bindgen(js_name = targetIdentifyingData)]
	#[wasm_bindgen(getter)]
	pub fn target_identifying_data(&self) -> JsString {
		self.target_identifying_data.clone().into()
	}

	#[wasm_bindgen(js_name = sourceIdentifyingData)]
	#[wasm_bindgen(getter)]
	pub fn source_identifying_data(&self) -> JsString {
		self.source_identifying_data.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> BE {
		self.backend.unwrap_or(Backend::Circom).into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = hashFunction)]
	pub fn hash_function(&self) -> JsString {
		self.hash_function.unwrap_or(HashFunction::Poseidon).into()
	}

	#[wasm_bindgen(getter)]
	pub fn curve(&self) -> WasmCurve {
		self.curve.unwrap_or(Curve::Bn254).into()
	}

	#[wasm_bindgen(getter)]
	pub fn secrets(&self) -> JsString {
		let secrets = self.secrets.iter().map(hex::encode).collect::<Vec<String>>().join(":");
		secrets.into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&self) -> JsString {
		self.token_symbol.clone().unwrap_or_default().into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		self.amount.clone().unwrap_or_default().into()
	}

	#[wasm_bindgen(getter)]
	pub fn denomination(&self) -> JsString {
		let denomination = self.denomination.unwrap_or_default().to_string();
		denomination.into()
	}

	#[wasm_bindgen(getter)]
	pub fn width(&self) -> JsString {
		let width = self.width.unwrap_or_default().to_string();
		width.into()
	}

	#[wasm_bindgen(getter)]
	pub fn exponentiation(&self) -> JsString {
		let exp = self.exponentiation.unwrap_or_default().to_string();
		exp.into()
	}
}

#[cfg(test)]
mod test {
	use ark_bn254;
	use wasm_bindgen_test::*;

	use crate::utils::to_rust_string;

	use super::*;

	type Bn254Fr = ark_bn254::Fr;

	#[test]
	fn deserialize_v1() {
		let note = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = JsNote::deserialize(note).unwrap();
		assert_eq!(note.protocol, NoteProtocol::Anchor);
		assert_eq!(note.backend, Some(Backend::Arkworks));
		assert_eq!(note.curve, Some(Curve::Bn254));
		assert_eq!(note.hash_function, Some(HashFunction::Poseidon));
		assert_eq!(note.token_symbol, Some(String::from("EDG")));
		assert_eq!(note.denomination, Some(18));
		assert_eq!(note.version, NoteVersion::V1);
		assert_eq!(note.width, Some(5));
		assert_eq!(note.exponentiation, Some(5));
		assert_eq!(note.target_chain_id, "3".to_string());
		assert_eq!(note.source_chain_id, "2".to_string());
	}

	#[test]
	fn generate_note_v1() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note_value = hex::decode("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717").unwrap();
		let note = JsNote {
			scheme: "webb://".to_string(),
			protocol: NoteProtocol::Anchor,
			version: NoteVersion::V1,
			source_chain_id: "2".to_string(),
			target_chain_id: "3".to_string(),
			source_identifying_data: "2".to_string(),
			target_identifying_data: "3".to_string(),
			width: Some(5),
			exponentiation: Some(5),
			denomination: Some(18),
			token_symbol: Some("EDG".to_string()),
			hash_function: Some(HashFunction::Poseidon),
			backend: Some(Backend::Arkworks),
			curve: Some(Curve::Bn254),
			amount: Some("0".to_string()),
			secrets: vec![note_value],
		};
		assert_eq!(note.to_string(), JsNote::from_str(note_str).unwrap().to_string());
	}

	#[test]
	fn deserialize_v2() {
		let note = "webb://v2:anchor/2:3/2:3/376530663462666132363364386239333835343737326339343835316330346233613961626133386162383038613864303831663666356265393735383131306237313437633339356565396266343935373334653437303362316636323230303963383137313235323064653062626435653761313032333763376438323962663662643664303732396363613737386564396236666231373262626231326230313932373235386163613765306136366664353639313534386638373137/?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=EDG&denom=18&amount=0";
		let note = JsNote::deserialize(note).unwrap();
		assert_eq!(note.protocol, NoteProtocol::Anchor);
		assert_eq!(note.backend, Some(Backend::Arkworks));
		assert_eq!(note.curve, Some(Curve::Bn254));
		assert_eq!(note.hash_function, Some(HashFunction::Poseidon));
		assert_eq!(note.token_symbol, Some(String::from("EDG")));
		assert_eq!(note.denomination, Some(18));
		assert_eq!(note.version, NoteVersion::V2);
		assert_eq!(note.width, Some(5));
		assert_eq!(note.exponentiation, Some(5));
		assert_eq!(note.target_chain_id, "3".to_string());
		assert_eq!(note.source_chain_id, "2".to_string());
	}

	#[test]
	fn generate_note_v2() {
		let note_str = "webb://v2:anchor/2:3/2:3/376530663462666132363364386239333835343737326339343835316330346233613961626133386162383038613864303831663666356265393735383131306237313437633339356565396266343935373334653437303362316636323230303963383137313235323064653062626435653761313032333763376438323962663662643664303732396363613737386564396236666231373262626231326230313932373235386163613765306136366664353639313534386638373137/?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=EDG&denom=18&amount=0";
		let note_value = "376530663462666132363364386239333835343737326339343835316330346233613961626133386162383038613864303831663666356265393735383131306237313437633339356565396266343935373334653437303362316636323230303963383137313235323064653062626435653761313032333763376438323962663662643664303732396363613737386564396236666231373262626231326230313932373235386163613765306136366664353639313534386638373137";
		let note_value_decoded = hex::decode(note_value).unwrap();
		let note = JsNote {
			scheme: "webb://".to_string(),
			protocol: NoteProtocol::Anchor,
			version: NoteVersion::V2,
			source_chain_id: "2".to_string(),
			target_chain_id: "3".to_string(),
			source_identifying_data: "2".to_string(),
			target_identifying_data: "3".to_string(),
			width: Some(5),
			exponentiation: Some(5),
			denomination: Some(18),
			token_symbol: Some("EDG".to_string()),
			hash_function: Some(HashFunction::Poseidon),
			backend: Some(Backend::Arkworks),
			curve: Some(Curve::Bn254),
			amount: Some("0".to_string()),
			secrets: vec![note_value_decoded],
		};
		assert_eq!(note.to_string(), note_str)
	}
	#[test]
	fn generate_leaf() {}

	#[wasm_bindgen_test]
	fn deserialize_to_js_note_v2() {
		let note_str = "webb://v2:anchor/1099511632777:1099511632778/0xD24260C102B5D128cbEFA0F655E5be3c2370677C:0xD30C8839c1145609E564b986F667b273Ddcb8496/01000000138a:00424d778a429c96530df11fc3e87f166109f4bad1cffc58d75577a87ea492c9:0048b277fb5e1d8d5a58079fcbf6036563d7429179681e1f83dae27e4e5c7cef/?curve=Bn254&width=3&exp=5&hf=Poseidon&backend=Circom&token=webbDEV&denom=18&amount=1";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();

		assert_eq!(to_rust_string(note.protocol()), NoteProtocol::Anchor.to_string());
		assert_eq!(to_rust_string(note.version()), NoteVersion::V2.to_string());
		assert_eq!(note.target_chain_id(), JsString::from("1099511632778"));
		assert_eq!(note.source_chain_id(), JsString::from("1099511632777"));

		assert_eq!(note.width(), JsString::from("3"));
		assert_eq!(note.exponentiation(), JsString::from("5"));
		assert_eq!(note.denomination(), JsString::from("18"));
		assert_eq!(note.token_symbol(), JsString::from("webbDEV"));

		assert_eq!(to_rust_string(note.backend()), Backend::Circom.to_string());
		assert_eq!(to_rust_string(note.curve()), Curve::Bn254.to_string());
		assert_eq!(to_rust_string(note.hash_function()), HashFunction::Poseidon.to_string());
		assert_eq!(note.secrets(), JsString::from("01000000138a:00424d778a429c96530df11fc3e87f166109f4bad1cffc58d75577a87ea492c9:0048b277fb5e1d8d5a58079fcbf6036563d7429179681e1f83dae27e4e5c7cef"))
	}

	#[wasm_bindgen_test]
	fn serialize_js_note_v2() {
		let note_str = "webb://v2:anchor/1099511632777:1099511632778/0xD24260C102B5D128cbEFA0F655E5be3c2370677C:0xD30C8839c1145609E564b986F667b273Ddcb8496/01000000138a:00424d778a429c96530df11fc3e87f166109f4bad1cffc58d75577a87ea492c9:0048b277fb5e1d8d5a58079fcbf6036563d7429179681e1f83dae27e4e5c7cef/?curve=Bn254&width=3&exp=5&hf=Poseidon&backend=Circom&token=webbDEV&denom=18&amount=1";

		let mut note_builder = JsNoteBuilder::new();
		let protocol: Protocol = JsValue::from(NoteProtocol::Anchor.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V2.to_string()).into();
		let backend: BE = JsValue::from(Backend::Circom.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();
		let curve: WasmCurve = JsValue::from(Curve::Bn254.to_string()).into();

		note_builder.protocol(protocol).unwrap();
		note_builder.version(version).unwrap();
		note_builder.target_chain_id(JsString::from("1099511632778"));
		note_builder.source_chain_id(JsString::from("1099511632777"));
		note_builder.source_identifying_data(JsString::from("0xD24260C102B5D128cbEFA0F655E5be3c2370677C"));
		note_builder.target_identifying_data(JsString::from("0xD30C8839c1145609E564b986F667b273Ddcb8496"));

		note_builder.width(JsString::from("3")).unwrap();
		note_builder.exponentiation(JsString::from("5")).unwrap();
		note_builder.denomination(JsString::from("18")).unwrap();
		note_builder.amount(JsString::from("1"));
		note_builder.token_symbol(JsString::from("webbDEV"));
		note_builder.curve(curve).unwrap();
		note_builder.hash_function(hash_function).unwrap();
		note_builder.backend(backend);
		note_builder.set_secrets(JsString::from("01000000138a:00424d778a429c96530df11fc3e87f166109f4bad1cffc58d75577a87ea492c9:0048b277fb5e1d8d5a58079fcbf6036563d7429179681e1f83dae27e4e5c7cef")).unwrap();
		let note = note_builder.build().unwrap();
		assert_eq!(note.serialize(), JsString::from(note_str));
	}

	#[wasm_bindgen_test]
	fn deserialize_to_js_note_v1() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = JsNote::js_deserialize(JsString::from(note_str)).unwrap();

		assert_eq!(to_rust_string(note.protocol()), NoteProtocol::Anchor.to_string());
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
	fn serialize_js_note_v1() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";

		let mut note_builder = JsNoteBuilder::new();
		let protocol: Protocol = JsValue::from(NoteProtocol::Anchor.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V1.to_string()).into();
		let backend: BE = JsValue::from(Backend::Arkworks.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();
		let curve: WasmCurve = JsValue::from(Curve::Bn254.to_string()).into();

		note_builder.protocol(protocol).unwrap();
		note_builder.version(version).unwrap();
		note_builder.source_chain_id(JsString::from("2"));
		note_builder.target_chain_id(JsString::from("3"));
		note_builder.source_identifying_data(JsString::from("2"));
		note_builder.target_identifying_data(JsString::from("3"));

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
		let note_from_str = JsNote::from_str(note_str).unwrap();
		assert_eq!(note.serialize(), note_from_str.serialize());
	}
	// VAnchor tests

	#[wasm_bindgen_test]
	fn generate_vanchor_note() {
		let mut note_builder = JsNoteBuilder::new();
		let protocol: Protocol = JsValue::from(NoteProtocol::VAnchor.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V1.to_string()).into();
		let backend: BE = JsValue::from(Backend::Arkworks.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();
		let curve: WasmCurve = JsValue::from(Curve::Bn254.to_string()).into();

		note_builder.protocol(protocol).unwrap();
		note_builder.version(version).unwrap();
		note_builder.source_chain_id(JsString::from("2"));
		note_builder.target_chain_id(JsString::from("3"));
		note_builder.source_identifying_data(JsString::from("2"));
		note_builder.target_identifying_data(JsString::from("3"));

		note_builder.width(JsString::from("5")).unwrap();
		note_builder.exponentiation(JsString::from("5")).unwrap();
		note_builder.denomination(JsString::from("18")).unwrap();
		note_builder.amount(JsString::from("10"));
		note_builder.token_symbol(JsString::from("EDG"));
		note_builder.curve(curve).unwrap();
		note_builder.hash_function(hash_function).unwrap();
		note_builder.backend(backend);
		note_builder.index(JsString::from("10"));

		let vanchor_note = note_builder.build().unwrap();
		let note_string = vanchor_note.to_string();
		let js_note_2 = JsNote::deserialize(&note_string).unwrap();
		let js_note_2_string = js_note_2.to_string();

		// Asserting that with serialization and deserialization lead to the same note
		assert_eq!(note_string, js_note_2_string);

		assert_eq!(vanchor_note.secrets.len(), 5)
	}
}
