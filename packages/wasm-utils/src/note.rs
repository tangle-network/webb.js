use core::fmt;
use std::convert::{TryFrom, TryInto};
use std::marker::PhantomData;
use std::str::FromStr;

use bulletproofs::{BulletproofGens, PedersenGens};

use crate::PoseidonHasher;

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
	/// Failed to generate secrets
	SecretGenFailed = 17,
}

impl fmt::Display for Backend {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Backend::Arkworks => write!(f, "Arkworks"),
			Backend::Bulletproofs => write!(f, "Bulletproofs"),
			Backend::Circom => write!(f, "Circom"),
		}
	}
}

impl FromStr for Backend {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Arkworks" => Ok(Backend::Arkworks),
			"Bulletproofs" => Ok(Backend::Bulletproofs),
			"Circom" => Ok(Backend::Circom),
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
	Circom,
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
pub trait NoteGenerator {
	type Rng;
	fn generate_secrets(&self, r: &mut Self::Rng) -> Result<Vec<u8>, OpStatusCode>;
	fn generate(&self, note_builder: &NoteBuilder, r: &mut Self::Rng) -> Result<Note, OpStatusCode> {
		let secrets = Self::generate_secrets(self, r).map_err(|_| OpStatusCode::SecretGenFailed)?;
		Ok(Note {
			prefix: note_builder.prefix.clone(),
			version: note_builder.version.clone(),
			chain: note_builder.chain.clone(),
			backend: note_builder.backend.clone(),
			curve: note_builder.curve.clone(),
			hash_function: note_builder.hash_function.clone(),
			token_symbol: note_builder.token_symbol.clone(),
			amount: note_builder.amount.clone(),
			denomination: note_builder.denomination.clone(),
			group_id: note_builder.group_id.clone(),
			secret: secrets,
		})
	}
}

pub trait LeafHasher {
	const SECRET_LENGTH: usize;
	type HasherOptions: Clone;
	fn hash(&self, secrets: &[u8], options: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode>;
}

pub struct NoteBuilder {
	pub prefix: String,
	pub version: NoteVersion,
	pub chain: String,
	/// zkp related items
	pub backend: Backend,
	pub hash_function: HashFunction,
	pub curve: Curve,
	pub token_symbol: String,
	pub amount: String,
	pub denomination: String,
	pub group_id: u32,
}

impl NoteBuilder {
	/*	fn get_net_generator(&self) -> Result<dyn Hasher + NoteGenerator, ()> {
		match (self.backend, self.curve, self.hash_function) {
			(Backend::Bulletproofs, ..) => {
				let opts = PoseidonHasherOptions::default();
				let pc_gens = PedersenGens::default();
				let bp_gens = opts.bp_gens.clone().unwrap_or_else(|| BulletproofGens::new(16_400, 1));

				let poseidon_hasher = PoseidonBuilder::new(opts.width)
					.sbox(PoseidonSbox::Exponentiation3)
					.bulletproof_gens(bp_gens)
					.pedersen_gens(pc_gens)
					.build();

				let poseidon_note_generator = PoseidonNoteGeneratorCurve25519 {
					hasher: poseidon_hasher,
				};
				Ok(poseidon_note_generator)
			}
			(Backend::Circom, ..) => {
				unimplemented!();
			}
			(Backend::Arkworks, Curve::Bn254) => {
				unimplemented!();
			}
			(Backend::Arkworks, Curve::Bls381) => {
				unimplemented!();
			}
		}
	}*/
}

impl Default for NoteBuilder {
	fn default() -> Self {
		Self {
			amount: "0".to_string(),
			chain: "any".to_string(),
			backend: Backend::Bulletproofs,
			denomination: "18".to_string(),
			version: NoteVersion::V1,
			prefix: NOTE_PREFIX.to_owned(),
			group_id: 0,
			curve: Curve::Curve25519,
			token_symbol: "EDG".to_string(),
			hash_function: HashFunction::Poseidon3,
		}
	}
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

impl Note {
	pub fn deserialize(note: &str) -> Result<Note, OpStatusCode> {
		note.parse().map_err(Into::into)
	}
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
		if note_val.len() == 0 {
			return Err(OpStatusCode::InvalidNoteSecrets);
		}
		let secret: Vec<u8> = hex::decode(&note_val)
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

pub struct PoseidonHasherOptions {
	/// The size of the permutation, in field elements.
	pub width: usize,
	/// Number of full SBox rounds in beginning
	pub full_rounds_beginning: Option<usize>,
	/// Number of full SBox rounds in end
	pub full_rounds_end: Option<usize>,
	/// Number of partial rounds
	pub partial_rounds: Option<usize>,
	/// The desired (classical) security level, in bits.
	pub security_bits: Option<usize>,
	/// Bulletproof generators for proving/verifying (serialized)
	pub bp_gens: Option<BulletproofGens>,
}

impl Default for PoseidonHasherOptions {
	fn default() -> Self {
		Self {
			width: 6,
			full_rounds_beginning: None,
			full_rounds_end: None,
			partial_rounds: None,
			security_bits: None,
			bp_gens: None,
		}
	}
}

#[cfg(test)]
mod test {
	use super::*;

	#[test]
	fn deserialize() {
		let note  = "webb.mix-v1-EDG-0-185c1090215e9a66ed3ef8594a7403060df60ac2159537acb10684592d45eb2b16de70eff19a1f80828cf47a5d16502702ff3262acf54cd0b0d0dd7cc67ad415-Curve25519-Poseidon3-Bulletproofs-18-any-0";
		let note = Note::deserialize(note).unwrap();
		assert_eq!(note.prefix.to_string(), "webb.mix".to_string());
		assert_eq!(note.version.to_string(), "v1".to_string());
		assert_eq!(note.token_symbol.to_string(), "EDG".to_string());
		assert_eq!(note.amount.to_string(), "0".to_string());
		assert_eq!(note.hash_function.to_string(), "Poseidon3".to_string());
		assert_eq!(note.backend.to_string(), "Bulletproofs".to_string());
		assert_eq!(note.denomination.to_string(), "18".to_string());
		assert_eq!(note.chain.to_string(), "any".to_string());
		assert_eq!(note.group_id.to_string(), "0".to_string());
		assert_eq!(note.curve.to_string(), "Curve25519".to_string());
	}
}
