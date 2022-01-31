use core::fmt;
use std::convert::{TryFrom, TryInto};
use std::ops::Deref;
use std::str::FromStr;

use arkworks_utils::utils::common::Curve as ArkCurve;
use js_sys::{JsString, Uint8Array};
use wasm_bindgen::__rt::core::fmt::Formatter;
use wasm_bindgen::prelude::*;

/// Final Operation Error
#[cfg(not(test))]
#[wasm_bindgen]
#[derive(PartialEq, Eq, Debug)]
pub struct OperationError {
	#[wasm_bindgen(skip)]
	pub code: OpStatusCode,
	#[wasm_bindgen(skip)]
	pub error_message: String,
	#[wasm_bindgen(skip)]
	pub data: Option<String>,
}

#[cfg(not(test))]
#[wasm_bindgen]
impl OperationError {
	#[wasm_bindgen(js_name = code)]
	#[wasm_bindgen(getter)]
	pub fn code(&self) -> JsValue {
		JsValue::from(self.code.clone() as u32)
	}

	#[wasm_bindgen(js_name = error_message)]
	#[wasm_bindgen(getter)]
	pub fn error_message(&self) -> JsString {
		JsString::from(self.error_message.clone())
	}

	#[wasm_bindgen(js_name = data)]
	#[wasm_bindgen(getter)]
	pub fn data(&self) -> JsString {
		match self.data.clone() {
			None => JsString::from("{}"),
			Some(e) => JsString::from(e),
		}
	}
}
/// For tests this will have a custom JsValue conversion
#[cfg(test)]
#[derive(PartialEq, Eq, Debug)]
pub struct OperationError {
	pub code: OpStatusCode,
	pub error_message: String,
	pub data: Option<String>,
}
#[cfg(test)]
impl OperationError {
	pub fn code(&self) -> JsValue {
		JsValue::from(self.code.clone() as u32)
	}

	pub fn error_message(&self) -> JsString {
		JsString::from(self.error_message.clone())
	}

	pub fn data(&self) -> JsString {
		match self.data.clone() {
			None => JsString::from("{}"),
			Some(e) => JsString::from(e),
		}
	}
}

#[cfg(test)]
impl From<OperationError> for JsValue {
	fn from(e: OperationError) -> Self {
		JsValue::from(e.to_string())
	}
}

impl fmt::Display for OperationError {
	fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
		write!(
			f,
			"Code {} , message {} , data {}",
			self.code.clone() as u32,
			self.error_message.clone(),
			self.data()
		)
	}
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum NoteVersion {
	V1,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Chain {
	Edgeware,
	Ganache,
	Beresheet,
	HarmonyTestShard1,
	Rinkeby,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Backend {
	Arkworks,
	Circom,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Curve {
	Bls381,
	Bn254,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum HashFunction {
	Poseidon,
	MiMCTornado,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum NotePrefix {
	Mixer,
	Bridge,
	Anchor,
	VAnchor,
}

impl fmt::Display for NoteVersion {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			NoteVersion::V1 => write!(f, "v1"),
		}
	}
}

impl FromStr for NoteVersion {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"v1" => Ok(NoteVersion::V1),
			_ => Err(OpStatusCode::InvalidNoteVersion),
		}
	}
}

impl fmt::Display for Backend {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Backend::Arkworks => write!(f, "Arkworks"),
			Backend::Circom => write!(f, "Circom"),
		}
	}
}

impl FromStr for Backend {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Arkworks" => Ok(Backend::Arkworks),
			"Circom" => Ok(Backend::Circom),
			_ => Err(OpStatusCode::InvalidBackend),
		}
	}
}

impl fmt::Display for Curve {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Curve::Bls381 => write!(f, "Bls381"),
			Curve::Bn254 => write!(f, "Bn254"),
		}
	}
}

impl FromStr for Curve {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Bls381" => Ok(Curve::Bls381),
			"Bn254" => Ok(Curve::Bn254),
			_ => Err(OpStatusCode::InvalidCurve),
		}
	}
}

impl fmt::Display for HashFunction {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			HashFunction::Poseidon => write!(f, "Poseidon"),
			HashFunction::MiMCTornado => write!(f, "MiMCTornado"),
		}
	}
}

impl FromStr for NotePrefix {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"webb.mixer" => Ok(NotePrefix::Mixer),
			"webb.bridge" => Ok(NotePrefix::Bridge),
			"webb.anchor" => Ok(NotePrefix::Anchor),
			"webb.vanchor" => Ok(NotePrefix::VAnchor),
			_ => Err(OpStatusCode::InvalidNotePrefix),
		}
	}
}

impl fmt::Display for NotePrefix {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			NotePrefix::Mixer => write!(f, "webb.mixer"),
			NotePrefix::Bridge => write!(f, "webb.bridge"),

			NotePrefix::Anchor => {
				write!(f, "webb.anchor")
			}
			NotePrefix::VAnchor => {
				write!(f, "webb.vanchor")
			}
		}
	}
}

impl FromStr for HashFunction {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Poseidon" => Ok(HashFunction::Poseidon),
			"MiMCTornado" => Ok(HashFunction::MiMCTornado),
			_ => Err(OpStatusCode::InvalidHasFunction),
		}
	}
}

impl From<Curve> for ArkCurve {
	fn from(curve: Curve) -> Self {
		match curve {
			Curve::Bls381 => ArkCurve::Bls381,
			Curve::Bn254 => ArkCurve::Bn254,
		}
	}
}

#[derive(Debug, Eq, PartialEq, Clone)]
#[repr(u32)]
pub enum OpStatusCode {
	Unknown = 0,
	/// Invalid hex string length when decoding
	InvalidHexLength = 1,
	/// Failed to parse hex string
	HexParsingFailed = 2,
	/// Invalid number of note parts when decoding
	InvalidNoteLength = 3,
	/// Invalid note prefix
	InvalidNotePrefix = 4,
	/// Invalid note version
	InvalidNoteVersion = 5,
	/// Invalid note id when parsing
	InvalidNoteId = 6,
	/// Invalid note block number when parsing
	InvalidNoteBlockNumber = 7,
	/// Invalid note secrets
	InvalidNoteSecrets = 8,
	/// Unable to find merkle tree
	MerkleTreeNotFound = 9,
	/// Failed serialization of passed params
	/// Error for failing to parse rust type into JsValue
	SerializationFailed = 10,
	/// Failed deserialization of JsValue into rust type
	DeserializationFailed = 11,
	/// Invalid Array of 32 bytes.
	InvalidArrayLength = 12,
	/// Invalid curve  when parsing
	InvalidCurve = 13,
	/// Invalid hashFunction id when parsing
	InvalidHasFunction = 14,
	/// Invalid backend id when parsing
	InvalidBackend = 15,
	/// Invalid denomination id when parsing
	InvalidDenomination = 16,
	/// Failed to generate secrets
	SecretGenFailed = 17,
	/// Invalid Source chain
	InvalidSourceChain = 18,
	/// Invalid target chain
	InvalidTargetChain = 19,
	/// Invalid Token Symbol
	InvalidTokenSymbol = 20,
	/// Invalid Exponentiation
	InvalidExponentiation = 21,
	/// Invalid Width
	InvalidWidth = 22,
	/// Invalid Amount
	InvalidAmount = 23,
	/// Invalid proof parameters
	InvalidProofParameters = 24,
	/// Invalid Proving key
	InvalidProvingKey = 25,
	/// Invalid Recipient
	InvalidRecipient = 26,
	/// Invalid Relayer
	InvalidRelayer = 27,
	/// Invalid LeafIndex
	InvalidLeafIndex = 28,
	/// Invalid Fee
	InvalidFee = 29,
	/// Invalid Refund
	InvalidRefund = 30,
	/// Invalid InvalidLeaves
	InvalidLeaves = 31,
	/// Failed to  Generating Leaf
	FailedToGenerateTheLeaf = 32,
	/// Note not set
	ProofBuilderNoteNotSet = 33,
	/// Commitment not set
	CommitmentNotSet = 34,
	/// Neighbour Roots aren't set
	RootsNotSet,
}

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type = "NotePrefix")]
	pub type Prefix;

	#[wasm_bindgen(typescript_type = "Curve")]
	pub type WasmCurve;

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
const NOTE_PREFIX: &str = "type NotePrefix = 'webb.mixer'|'webb.bridge'|'webb.anchor'|'webb.vanchor' ";

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

pub struct Uint8Arrayx32(pub [u8; 32]);

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
impl From<OpStatusCode> for String {
	fn from(e: OpStatusCode) -> Self {
		match e {
			OpStatusCode::Unknown => "Unknown error",
			OpStatusCode::InvalidHexLength => "Invalid hex length",
			OpStatusCode::HexParsingFailed => "Fail to parse hex",
			OpStatusCode::InvalidNoteLength => "Invalid note length",
			OpStatusCode::InvalidNotePrefix => "Invalid note prefix",
			OpStatusCode::InvalidNoteVersion => "Invalid note version",
			OpStatusCode::InvalidNoteId => "Invalid note id",
			OpStatusCode::InvalidNoteBlockNumber => "Invalid block number",
			OpStatusCode::InvalidNoteSecrets => "Invalid note secrets",
			OpStatusCode::MerkleTreeNotFound => "Merkle tree not found",
			OpStatusCode::SerializationFailed => "Failed to serialize",
			OpStatusCode::DeserializationFailed => "Failed to deserialize",
			OpStatusCode::InvalidArrayLength => "Invalid array length",
			OpStatusCode::InvalidCurve => "Invalid curve",
			OpStatusCode::InvalidHasFunction => "Invalid hash function",
			OpStatusCode::InvalidBackend => "Invalid backend",
			OpStatusCode::InvalidDenomination => "Invalid denomination",
			OpStatusCode::SecretGenFailed => "Failed to generate secrets",
			OpStatusCode::InvalidSourceChain => "Invalid source chain id",
			OpStatusCode::InvalidTargetChain => "Invalid target chain id",
			OpStatusCode::InvalidTokenSymbol => "Invalid token symbol",
			OpStatusCode::InvalidExponentiation => "Invalid exponentiation",
			OpStatusCode::InvalidWidth => "Invalid width",
			OpStatusCode::InvalidAmount => "Invalid amount",
			OpStatusCode::InvalidProofParameters => "Invalid proof parameters",
			OpStatusCode::InvalidProvingKey => "Invalid proving key",
			OpStatusCode::InvalidRecipient => "Invalid recipient",
			OpStatusCode::InvalidRelayer => "Invalid relayer",
			OpStatusCode::InvalidLeafIndex => "Invalid leaf index",
			OpStatusCode::InvalidFee => "Invalid fee",
			OpStatusCode::InvalidRefund => "Invalid refund",
			OpStatusCode::InvalidLeaves => "Invalid leaf",
			OpStatusCode::FailedToGenerateTheLeaf => "Failed to generate the leaf",
			OpStatusCode::ProofBuilderNoteNotSet => "Proof building failed not not set",
			OpStatusCode::CommitmentNotSet => "Proof building failed refresh commitment not set",
			OpStatusCode::RootsNotSet => "Proof building failed roots not set",
		}
		.to_string()
	}
}
impl From<OpStatusCode> for OperationError {
	fn from(e: OpStatusCode) -> Self {
		OperationError {
			code: e.clone(),
			data: None,
			error_message: e.into(),
		}
	}
}

impl From<OpStatusCode> for JsValue {
	fn from(e: OpStatusCode) -> Self {
		let op: OperationError = e.into();
		op.into()
	}
}

impl From<Backend> for JsString {
	fn from(e: Backend) -> Self {
		JsString::from(e.to_string())
	}
}

impl From<Curve> for JsString {
	fn from(e: Curve) -> Self {
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

impl From<Curve> for WasmCurve {
	fn from(curve: Curve) -> Self {
		let js_str = curve.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<HashFunction> for HF {
	fn from(curve: HashFunction) -> Self {
		let js_str = curve.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<NoteVersion> for Version {
	fn from(curve: NoteVersion) -> Self {
		let js_str = curve.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<Backend> for BE {
	fn from(curve: Backend) -> Self {
		let js_str = curve.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<NotePrefix> for Prefix {
	fn from(curve: NotePrefix) -> Self {
		let js_str = curve.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

#[cfg(not(test))]
#[wasm_bindgen(start)]
pub fn main() {
	console_error_panic_hook::set_once();
}
