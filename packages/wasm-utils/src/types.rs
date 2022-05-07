#![allow(clippy::unused_unit)]
use core::convert::{TryFrom, TryInto};
use core::fmt;
use core::ops::Deref;
use core::str::FromStr;

use arkworks_setups::Curve as ArkCurve;
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

#[allow(clippy::unused_unit)]
#[cfg(not(test))]
#[wasm_bindgen]
impl OperationError {
	#[wasm_bindgen(js_name = code)]
	#[wasm_bindgen(getter)]
	pub fn code(&self) -> JsValue {
		JsValue::from(self.code.clone() as u32)
	}

	// For backward compatibility
	#[wasm_bindgen(js_name = error_message)]
	#[wasm_bindgen(getter)]
	pub fn error_message(&self) -> JsString {
		JsString::from(self.error_message.clone())
	}

	#[wasm_bindgen(js_name = message)]
	#[wasm_bindgen(getter)]
	pub fn message(&self) -> JsString {
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
			"Code {}, message {}, data {}",
			self.code.clone() as u32,
			self.error_message.clone(),
			self.data()
		)
	}
}

impl OperationError {
	pub fn new_with_message(code: OpStatusCode, message: String) -> Self {
		let mut oe: Self = code.into();
		oe.error_message = message;
		oe
	}
}
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum NoteVersion {
	V1,
	V2,
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
pub enum NoteProtocol {
	Mixer,
	Anchor,
	VAnchor,
}

impl fmt::Display for NoteVersion {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			NoteVersion::V1 => write!(f, "v1"),
			NoteVersion::V2 => write!(f, "v2"),
		}
	}
}

impl FromStr for NoteVersion {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"v1" => Ok(NoteVersion::V1),
			"v2" => Ok(NoteVersion::V2),
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

impl FromStr for NoteProtocol {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"mixer" => Ok(NoteProtocol::Mixer),
			"anchor" | "bridge" => Ok(NoteProtocol::Anchor),
			"vanchor" => Ok(NoteProtocol::VAnchor),
			_ => Err(OpStatusCode::InvalidNoteProtocol),
		}
	}
}

impl fmt::Display for NoteProtocol {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			NoteProtocol::Mixer => write!(f, "mixer"),
			NoteProtocol::Anchor => write!(f, "anchor"),
			NoteProtocol::VAnchor => write!(f, "vanchor"),
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
	/// Invalid note protocol
	InvalidNoteProtocol = 4,
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
	RootsNotSet = 35,
	/// Invalid note misc data
	InvalidNoteMiscData = 36,
	/// Invalid Source IdentifyingData
	InvalidSourceIdentifyingData = 37,
	/// Invalid target IdentifyingData
	InvalidTargetIdentifyingData = 38,
	/// Unsupported combination of parameters
	UnsupportedParameterCombination = 39,
	/// Invalid proof on verification
	InvalidProof = 40,
	/// Invalid index
	InvalidUTXOIndex = 41,
	/// Unsupported Backend
	UnsupportedBackend = 42,
	/// Public amount not set
	PublicAmountNotSet = 43,
	/// VAnchor Proof Chain Id not set
	VAnchorProofChainId = 44,
	/// VAnchor proof not set
	VAnchorNotesNotSet = 45,
	/// VAnchor proof indices
	VAnchorProofIndices = 46,
	/// VAnchor proof leaves map not defined
	VAnchorProofLeavesMap = 47,
	/// Generic error while trying to instantiate proof input field
	ProofInputFieldInstantiationError = 48,
	/// Invalid filed for the proof input protocol
	ProofInputFieldInstantiationProtocolInvalid = 49,
}

#[wasm_bindgen]
extern "C" {
	// Use `js_namespace` here to bind `console.log(..)` instead of just
	// `log(..)`
	#[wasm_bindgen(js_namespace = console)]
	pub fn log(s: &str);

	#[wasm_bindgen(typescript_type = "NoteProtocol")]
	pub type Protocol;

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
const NOTE_PROTOCOL: &str = "type NoteProtocol = 'mixer'|'anchor'|'vanchor' ";

#[wasm_bindgen(typescript_custom_section)]
const LEAVES: &str = "type Leaves = Array<Uint8Array>;";

#[wasm_bindgen(typescript_custom_section)]
const HF: &str = "type HashFunction = 'Poseidon'|'MiMCTornado'";

#[wasm_bindgen(typescript_custom_section)]
const CURVE: &str = "type Curve = 'Bls381'|'Bn254' |'Curve25519'";

#[wasm_bindgen(typescript_custom_section)]
const VERSION: &str = "type Version = 'v1' | 'v2'";

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
			OpStatusCode::HexParsingFailed => "Failed to parse hex",
			OpStatusCode::InvalidNoteLength => "Invalid note length",
			OpStatusCode::InvalidNoteProtocol => "Invalid note protocol",
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
			OpStatusCode::InvalidRecipient => "Invalid recipient address",
			OpStatusCode::InvalidRelayer => "Invalid relayer address",
			OpStatusCode::InvalidLeafIndex => "Invalid leaf index",
			OpStatusCode::InvalidFee => "Invalid fee",
			OpStatusCode::InvalidRefund => "Invalid refund",
			OpStatusCode::InvalidLeaves => "Invalid leaves",
			OpStatusCode::FailedToGenerateTheLeaf => "Failed to generate the leaf",
			OpStatusCode::ProofBuilderNoteNotSet => "Proof building failed note isn't set",
			OpStatusCode::CommitmentNotSet => "Proof building failed refresh commitment isn't set",
			OpStatusCode::RootsNotSet => "Proof building failed roots array isn't set",
			OpStatusCode::InvalidNoteMiscData => "Invalid note misc data",
			OpStatusCode::InvalidSourceIdentifyingData => "Invalid source identifying data",
			OpStatusCode::InvalidTargetIdentifyingData => "Invalid target identifying data",
			OpStatusCode::UnsupportedParameterCombination => "Unsupported Paramater combination to generate proof",
			OpStatusCode::InvalidProof => "Proof verification failed",
			OpStatusCode::InvalidUTXOIndex => "Invalid UTXO Index value",
			OpStatusCode::UnsupportedBackend => "Unsupported backend",
			OpStatusCode::PublicAmountNotSet => "VAnchor proof input requires public amount field",
			OpStatusCode::VAnchorProofChainId => "VAnchor proof input requires chain id",
			OpStatusCode::VAnchorNotesNotSet => "VAnchor proof input requires list of notes",
			OpStatusCode::VAnchorProofIndices => "VAnchor proof input require list of indices",
			OpStatusCode::VAnchorProofLeavesMap => "VAnchor proof input require leaves  map",
			OpStatusCode::ProofInputFieldInstantiationError => "The proof input field installation failed",
			OpStatusCode::ProofInputFieldInstantiationProtocolInvalid => {
				"The proof input field installation failed wrong protocol or field"
			}
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

impl From<NoteProtocol> for JsString {
	fn from(e: NoteProtocol) -> Self {
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
	fn from(hash_function: HashFunction) -> Self {
		let js_str = hash_function.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<NoteVersion> for Version {
	fn from(version: NoteVersion) -> Self {
		let js_str = version.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<Backend> for BE {
	fn from(backend: Backend) -> Self {
		let js_str = backend.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

impl From<NoteProtocol> for Protocol {
	fn from(proto: NoteProtocol) -> Self {
		let js_str = proto.to_string();
		JsValue::from(&js_str).try_into().unwrap()
	}
}

#[cfg(not(test))]
#[allow(clippy::unused_unit)]
#[wasm_bindgen(start)]
pub fn main() {
	console_error_panic_hook::set_once();
}
