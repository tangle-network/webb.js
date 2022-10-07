use core::fmt;
use core::str::FromStr;

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

pub mod mixer;
pub mod vanchor;
pub mod versioning;

#[allow(unused_macros)]
macro_rules! console_log {
	// Note that this is using the `log` function imported above during
	// `bare_bones`
	($($t:tt)*) => (crate::types::log(&format_args!($($t)*).to_string()))
}
pub enum JsLeafInner {
	Mixer(Leaf),
	VAnchor(JsUtxo),
}

impl Clone for JsLeafInner {
	fn clone(&self) -> Self {
		match self {
			JsLeafInner::Mixer(leaf) => JsLeafInner::Mixer(Leaf {
				chain_id_bytes: leaf.chain_id_bytes.clone(),
				secret_bytes: leaf.secret_bytes.clone(),
				nullifier_bytes: leaf.nullifier_bytes.clone(),
				leaf_bytes: leaf.leaf_bytes.clone(),
				nullifier_hash_bytes: leaf.nullifier_hash_bytes.clone(),
			}),
			JsLeafInner::VAnchor(utxo) => JsLeafInner::VAnchor(utxo.clone()),
		}
	}
}
#[wasm_bindgen]
pub struct JsLeaf {
	#[wasm_bindgen(skip)]
	pub inner: JsLeafInner,
}
impl JsLeaf {
	pub fn mixer_leaf(&self) -> Result<Leaf, OperationError> {
		match self.inner.clone() {
			JsLeafInner::Mixer(leaf) => Ok(leaf),
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
		}
	}

	pub fn vanchor_leaf(&self) -> Result<JsUtxo, OperationError> {
		match self.inner.clone() {
			JsLeafInner::VAnchor(leaf) => Ok(leaf),
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
		}
	}
}
#[wasm_bindgen]
impl JsLeaf {
	#[wasm_bindgen(getter)]
	pub fn protocol(&self) -> Protocol {
		let protocol = match self.inner {
			JsLeafInner::Mixer(_) => "mixer",
			JsLeafInner::VAnchor(_) => "vanchor",
		};

		JsValue::from(protocol).into()
	}

	#[wasm_bindgen(getter)]
	pub fn commitment(&self) -> Uint8Array {
		match &self.inner {
			JsLeafInner::Mixer(leaf) => Uint8Array::from(leaf.leaf_bytes.as_slice()),
			JsLeafInner::VAnchor(vanchor_leaf) => vanchor_leaf.commitment(),
		}
	}
}
impl JsNote {
	/// Deseralize note from a string
	pub fn deserialize(note: &str) -> Result<Self, OperationError> {
		note.parse().map_err(Into::into)
	}

	pub fn mutate_index(&mut self, index: u64) -> Result<(), OperationError> {
		match self.protocol {
			NoteProtocol::VAnchor => {}
			_ => {
				let message = "Index secret can be set only for VAnchor".to_string();
				let oe = OperationError::new_with_message(OpStatusCode::InvalidNoteProtocol, message);
				return Err(oe);
			}
		}

		self.index = Some(index);
		Ok(())
	}

	pub fn get_leaf_and_nullifier(&self) -> Result<JsLeaf, OperationError> {
		match self.protocol {
			NoteProtocol::Mixer => {
				let raw = match self.version {
					NoteVersion::V1 => {
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
			NoteProtocol::VAnchor => match self.version {
				NoteVersion::V1 => {
					if self.secrets.len() == 4 {
						let chain_id = self.secrets[0].clone();

						let amount = self.secrets[1].clone();
						let secret_key = self.secrets[2].clone();
						let blinding = self.secrets[3].clone();
						let index = self.index;

						let mut amount_slice = [0u8; 16];
						amount_slice.copy_from_slice(amount[16..32].to_vec().as_slice());
						let amount = u128::from_be_bytes(amount_slice);

						let mut chain_id_slice = [0u8; 8];
						chain_id_slice.copy_from_slice(chain_id[chain_id.len() - 8..].to_vec().as_slice());
						let chain_id = u64::from_be_bytes(chain_id_slice);

						let curve = self.curve.unwrap_or(Curve::Bn254);
						let width = self.width.unwrap_or(2);
						let exponentiation = self.exponentiation.unwrap_or(5);

						let utxo = vanchor::get_leaf_with_private_raw(
							curve,
							width,
							exponentiation,
							Some(secret_key),
							Some(blinding),
							chain_id,
							amount,
							index,
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

	pub fn get_js_utxo(&self) -> Result<JsUtxo, OperationError> {
		let leaf = self.get_leaf_and_nullifier()?;
		match leaf.inner {
			JsLeafInner::VAnchor(utxo) => Ok(utxo),
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
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
			if self.index.is_some() {
				format!("index={}", self.index.unwrap())
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
		versioning::v1::note_from_str(s)
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

	#[wasm_bindgen(skip)]
	pub index: Option<u64>,
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
	#[wasm_bindgen(skip)]
	pub private_key: Option<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub blinding: Option<Vec<u8>>,
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

	#[wasm_bindgen(js_name = setPrivateKey)]
	pub fn set_private_key(&mut self, private_key: Uint8Array) -> Result<(), JsValue> {
		self.private_key = Some(private_key.to_vec());
		Ok(())
	}

	#[wasm_bindgen(js_name = setBlinding)]
	pub fn set_blinding(&mut self, blinding: Uint8Array) -> Result<(), JsValue> {
		self.blinding = Some(blinding.to_vec());
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
		let source_identifying_data = self.source_identifying_data.ok_or_else(|| "".to_string())?;
		let target_identifying_data = self.target_identifying_data.ok_or_else(|| "".to_string())?;

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
				NoteProtocol::VAnchor => {
					let blinding = self.blinding;
					let private_key = self.private_key;
					let utxo = vanchor::get_leaf_with_private_raw(
						curve.unwrap_or(Curve::Bn254),
						width.unwrap_or(5),
						exponentiation.unwrap_or(5),
						private_key,
						blinding,
						chain_id,
						amount.unwrap_or_else(|| "0".to_string()).parse().unwrap(),
						index,
					)?;

					let chain_id = utxo.get_chain_id_bytes();
					let amount = utxo.get_amount();
					let blinding = utxo.get_blinding();
					let secret_key = utxo.get_secret_key().unwrap();

					// secrets
					vec![chain_id, amount, blinding, secret_key]
				}
			},
			Some(secrets) => {
				match protocol {
					NoteProtocol::Mixer => {
						if secrets.len() != 1 {
							let message = "Mixer secrets length should be 1 in length".to_string();
							let operation_error =
								OperationError::new_with_message(OpStatusCode::InvalidNoteSecrets, message);
							return Err(operation_error.into());
						}
					}
					NoteProtocol::VAnchor => {
						if secrets.len() != 4 {
							let message = "VAnchor secrets length should be 4 in length".to_string();
							let operation_error =
								OperationError::new_with_message(OpStatusCode::InvalidNoteSecrets, message);
							return Err(operation_error.into());
						}
					}
				};

				secrets
			}
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
			index,
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

	#[wasm_bindgen(js_name = mutateIndex)]
	pub fn js_mutate_index(&mut self, index: JsString) -> Result<(), JsValue> {
		let index: String = index.into();
		let index: u64 = index.parse().map_err(|_| OpStatusCode::InvalidNoteVersion)?;

		self.mutate_index(index).map_err(|e| e.into())
	}

	#[wasm_bindgen(js_name = defaultUtxoNote)]
	pub fn default_utxo_note(note: &JsNote) -> Result<JsNote, OperationError> {
		let mut new_note = JsNote {
			scheme: note.scheme.clone(),
			protocol: note.protocol,
			version: note.version,
			source_chain_id: note.source_chain_id.clone(),
			target_chain_id: note.target_chain_id.clone(),
			source_identifying_data: note.source_identifying_data.clone(),
			target_identifying_data: note.target_identifying_data.clone(),
			secrets: note.secrets.clone(),
			curve: note.curve,
			exponentiation: note.exponentiation,
			width: note.width,
			token_symbol: note.token_symbol.clone(),
			amount: Some("0".to_string()),
			denomination: note.denomination,
			backend: note.backend,
			hash_function: note.hash_function,
			index: Some(0),
		};
		let chain_id: u64 = new_note
			.target_chain_id
			.parse()
			.map_err(|_| OpStatusCode::InvalidTargetChain)?;

		let utxo = vanchor::generate_secrets(
			0,
			new_note.exponentiation.unwrap_or(5),
			new_note.width.unwrap_or(5),
			new_note.curve.unwrap_or(Curve::Bn254),
			chain_id,
			Some(0),
			&mut OsRng,
		)?;
		new_note.update_vanchor_utxo(utxo)?;
		Ok(new_note)
	}

	#[wasm_bindgen(js_name = getUtxo)]
	pub fn get_utxo(&self) -> Result<JsUtxo, OperationError> {
		match self.protocol {
			NoteProtocol::VAnchor => {
				let leaf = self.get_leaf_and_nullifier()?;
				leaf.vanchor_leaf()
			}
			_ => Err(OpStatusCode::InvalidNoteProtocol.into()),
		}
	}

	// for test and internal usage
	pub fn update_vanchor_utxo(&mut self, utxo: JsUtxo) -> Result<(), OperationError> {
		let chain_id = utxo.get_chain_id_bytes();
		let amount = utxo.get_amount();
		let blinding = utxo.get_blinding();
		let secret_key = utxo.get_secret_key().unwrap();
		self.amount = Some(utxo.get_amount_raw().to_string());
		self.secrets = vec![chain_id, amount, blinding, secret_key];
		Ok(())
	}

	#[wasm_bindgen(getter)]
	pub fn index(&self) -> JsString {
		match self.index {
			None => JsString::from(""),
			Some(index) => JsString::from(index.to_string().as_str()),
		}
	}
}

#[cfg(test)]
mod test {
	use ark_bn254;
	use wasm_bindgen_test::*;

	use super::*;

	type Bn254Fr = ark_bn254::Fr;

	#[wasm_bindgen_test]
	fn generate_mixer_note() {
		let mut note_builder = JsNoteBuilder::new();
		let protocol: Protocol = JsValue::from(NoteProtocol::Mixer.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V1.to_string()).into();
		let backend: BE = JsValue::from(Backend::Arkworks.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();
		let curve: WasmCurve = JsValue::from(Curve::Bn254.to_string()).into();

		note_builder.protocol(protocol).unwrap();
		note_builder.version(version).unwrap();
		note_builder.source_chain_id(JsString::from("2"));
		note_builder.target_chain_id(JsString::from("2"));
		note_builder.source_identifying_data(JsString::from("2"));
		note_builder.target_identifying_data(JsString::from("2"));

		note_builder.width(JsString::from("3")).unwrap();
		note_builder.exponentiation(JsString::from("5")).unwrap();
		note_builder.denomination(JsString::from("18")).unwrap();
		note_builder.amount(JsString::from("10"));
		note_builder.token_symbol(JsString::from("EDG"));
		note_builder.curve(curve).unwrap();
		note_builder.hash_function(hash_function).unwrap();
		note_builder.backend(backend);
		note_builder.index(JsString::from("10")).unwrap();

		let mixer_note = note_builder.build().unwrap();
		let note_string = mixer_note.to_string();
		let leaf = mixer_note.get_leaf_commitment().unwrap();
		let leaf_vec = leaf.to_vec();

		let js_note_2 = JsNote::deserialize(&note_string).unwrap();
		let js_note_2_string = js_note_2.to_string();

		let leaf_2 = js_note_2.get_leaf_commitment().unwrap();
		let leaf_2_vec = leaf_2.to_vec();

		// Asserting that with serialization and deserialization lead to the same note
		assert_eq!(note_string, js_note_2_string);
		assert_eq!(mixer_note.secrets.len(), 2);
		assert_eq!(hex::encode(leaf_vec), hex::encode(leaf_2_vec));
	}

	#[wasm_bindgen_test]
	fn should_deserialize_mixer_note() {
		let mixer_note = "webb://v1:mixer/2:2/2:2/fd717cfe463b3ffec71ee6b7606bbd0179170510abf41c9f16c1d20ca9923f0e:18b6b080e6a43262f00f6fb3da0d2409c4871b8f26d89d5c8836358e1af5a41c/?curve=Bn254&width=3&exp=5&hf=Poseidon&backend=Arkworks&token=EDG&denom=18&amount=10&index=10";
		let note = JsNote::deserialize(mixer_note).unwrap();
		// Generate leaf to trigger any errors
		note.get_leaf_commitment().unwrap();
		assert_eq!(note.serialize(), mixer_note);
	}

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
		note_builder.index(JsString::from("10")).unwrap();

		let vanchor_note = note_builder.build().unwrap();
		let note_string = vanchor_note.to_string();
		let leaf = vanchor_note.get_leaf_commitment().unwrap();
		let leaf_vec = leaf.to_vec();

		let js_note_2 = JsNote::deserialize(&note_string).unwrap();
		let js_note_2_string = js_note_2.to_string();

		let leaf_2 = js_note_2.get_leaf_commitment().unwrap();
		let leaf_2_vec = leaf_2.to_vec();

		// Asserting that with serialization and deserialization lead to the same note
		assert_eq!(note_string, js_note_2_string);
		assert_eq!(vanchor_note.secrets.len(), 4);
		assert_eq!(hex::encode(leaf_vec), hex::encode(leaf_2_vec));
	}

	#[wasm_bindgen_test]
	fn should_deserialize_vanchor_note() {
		let vanchor_note_str = "webb://v1:vanchor/2:3/2:3/0300000000000000000000000000000000000000000000000000000000000000:0a00000000000000000000000000000000000000000000000000000000000000:7798d054444ec463be7d41ad834147b5b2c468182c7cd6a601aec29a273fca05:bf5d780608f5b8a8db1dc87356a225a0324a1db61903540daaedd54ab10a4124/?curve=Bn254&width=5&exp=5&hf=Poseidon&backend=Arkworks&token=EDG&denom=18&amount=10&index=10";
		let note = JsNote::deserialize(vanchor_note_str).unwrap();
		// Generate leaf to trigger any errors
		note.get_leaf_commitment().unwrap();
		assert_eq!(note.serialize(), vanchor_note_str);
	}
}
