use arkworks_utils::utils::common::Curve as ArkCurve;
use core::fmt;
use std::str::FromStr;

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
	Curve25519,
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
			Curve::Curve25519 => write!(f, "Curve25519"),
			Curve::Bls381 => write!(f, "Bls381"),
			Curve::Bn254 => write!(f, "Bn254"),
		}
	}
}

impl FromStr for Curve {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Curve25519" => Ok(Curve::Curve25519),
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
			_ => Err(OpStatusCode::InvalidHasFunction),
		}
	}
}

impl fmt::Display for NotePrefix {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			NotePrefix::Mixer => write!(f, "webb.mixer"),
			NotePrefix::Bridge => write!(f, "webb.bridge"),
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
			Curve::Curve25519 => unimplemented!(),
		}
	}
}

#[derive(Debug, Eq, PartialEq)]
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
}
