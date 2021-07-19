use core::fmt;
use std::convert::TryInto;
use std::str::FromStr;

const FULL_NOTE_LENGTH: usize = 11;
const NOTE_PREFIX: &str = "webb.mix";

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
}

impl fmt::Display for Backend {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Backend::Arkworks => write!(f, "Arkworks"),
			Backend::Bulletproofs => write!(f, "Bulletproofs"),
		}
	}
}

impl FromStr for Backend {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Arkworks" => Ok(Backend::Arkworks),
			"Bulletproofs" => Ok(Backend::Bulletproofs),
			_ => Err(OpStatusCode::InvalidBackend),
		}
	}
}

impl fmt::Display for HashFunction {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			HashFunction::Poseidon3 => write!(f, "Poseidon3"),
			HashFunction::Poseidon5 => write!(f, "Poseidon5"),
			HashFunction::Poseidon17 => write!(f, "Poseidon17"),
			HashFunction::MiMCTornado => write!(f, "MiMCTornado"),
		}
	}
}

impl FromStr for HashFunction {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Poseidon3" => Ok(HashFunction::Poseidon3),
			"Poseidon5" => Ok(HashFunction::Poseidon5),
			"Poseidon17" => Ok(HashFunction::Poseidon17),
			"MiMCTornado" => Ok(HashFunction::MiMCTornado),
			_ => Err(OpStatusCode::InvalidHasFunction),
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

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Backend {
	Bulletproofs,
	Arkworks,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum HashFunction {
	Poseidon3,
	Poseidon5,
	Poseidon17,
	MiMCTornado,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Curve {
	Bls381,
	Bn254,
	Curve25519,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum NoteVersion {
	V1,
}

pub struct Note {
	pub prefix: String,
	pub version: NoteVersion,
	pub chain: String,

	/// zkp related items
	pub backend: Backend,
	pub hash_function: HashFunction,
	pub curve: Curve,

	/// mixer related items
	pub secret: Vec<u8>,

	pub token_symbol: String,
	pub amount: String,
	pub denomination: String,

	group_id: u32,
}

impl fmt::Display for Note {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		let secrets = hex::encode(&self.secret);
		let mut parts: Vec<String> = vec![
			//0 => prefix
			self.prefix.clone(),
			//1 => version
			self.version.to_string(),
			//2 => token_symbol
			self.token_symbol.clone(),
			//3 => group_id
			format!("{}", self.group_id),
			//4
			format!("{}", secrets),
			//5 => curve
			self.curve.to_string(),
			//6 => hash_function
			self.hash_function.to_string(),
			//7 => backend
			self.backend.to_string(),
			//8 => denomination
			self.denomination.clone(),
			//9 => chain
			self.chain.clone(),
			//10 => amount
			self.amount.clone(),
		];
		let note = parts.join("-");
		write!(f, "{}", note)
	}
}

impl FromStr for Note {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		let parts: Vec<&str> = s.split('-').collect();
		let full = parts.len() == FULL_NOTE_LENGTH;
		if !full {
			return Err(OpStatusCode::InvalidNoteLength);
		}

		if parts[0] != NOTE_PREFIX {
			return Err(OpStatusCode::InvalidNotePrefix);
		}

		let version: NoteVersion = parts[1].parse()?;
		let token_symbol = parts[2].to_owned();
		let group_id = parts[3].parse().map_err(|_| OpStatusCode::InvalidNoteId)?;
		let note_val = parts[4];
		// Todo change this 128 62
		if note_val.len() != 128 {
			return Err(OpStatusCode::InvalidNoteSecrets);
		}
		let secret: Vec<u8> = hex::decode(&note_val[..64])
			.map(|v| v.try_into())
			.map_err(|_| OpStatusCode::InvalidHexLength)?
			.map_err(|_| OpStatusCode::HexParsingFailed)?;
		let curve: Curve = parts[5].parse()?;
		let hash_function: HashFunction = parts[6].parse()?;
		let backend: Backend = parts[7].parse()?;
		let denomination = parts[8].to_string();
		let chain = parts[9].to_string();
		let amount = parts[10].to_string();
		Ok(Note {
			prefix: NOTE_PREFIX.to_owned(),
			version,
			token_symbol,
			group_id,
			secret,
			curve,
			hash_function,
			backend,
			denomination,
			chain,
			amount,
		})
	}
}
