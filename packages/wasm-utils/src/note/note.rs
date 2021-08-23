use core::fmt;
use std::str::FromStr;

use bulletproofs::{BulletproofGens, PedersenGens};
use bulletproofs_gadgets::poseidon::{PoseidonBuilder, PoseidonSbox};

use crate::note::arkworks_poseidon_bls12_381::ArkworksPoseidonBls12_381NoteGenerator;
use crate::note::arkworks_poseidon_bn254::ArkworksPoseidonBn254NoteGenerator;
use crate::types::{Backend, Curve, HashFunction, NoteVersion, OpStatusCode};

// use crate::note::bulletproof_posidon_25519::PoseidonNoteGeneratorCurve25519;

const FULL_NOTE_LENGTH: usize = 11;
const NOTE_PREFIX: &str = "webb.mix";

pub trait NoteGenerator {
	type Rng;
	fn get_rng(&self) -> Self::Rng;

	fn generate_secrets(&self, r: &mut Self::Rng) -> Result<Vec<u8>, OpStatusCode>;
	fn generate(&self, note_builder: &NoteBuilder, r: &mut Self::Rng) -> Result<Note, OpStatusCode> {
		let secrets = Self::generate_secrets(self, r).map_err(|_| OpStatusCode::SecretGenFailed)?;
		Ok(Note {
			prefix: note_builder.prefix.clone(),
			version: note_builder.version,
			chain: note_builder.chain.clone(),
			backend: note_builder.backend,
			curve: note_builder.curve,
			hash_function: note_builder.hash_function,
			token_symbol: note_builder.token_symbol.clone(),
			amount: note_builder.amount.clone(),
			denomination: note_builder.denomination.clone(),
			group_id: note_builder.group_id,
			secret: secrets,
		})
	}
}

pub trait LeafHasher {
	const SECRET_LENGTH: usize;
	type HasherOptions: Clone;
	fn hash(&self, secrets: &[u8], options: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode>;
}
#[derive(Debug)]
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

struct NoteManager;

impl NoteManager {
	fn generate(note_builder: &NoteBuilder) -> Result<Note, ()> {
		match (note_builder.backend, note_builder.curve) {
			(_, Curve::Curve25519) => {
				/*				let opts = PoseidonHasherOptions::default();
				let pc_gens = PedersenGens::default();
				let bp_gens = opts.bp_gens.clone().unwrap_or_else(|| BulletproofGens::new(16_400, 1));

				let poseidon_hasher = PoseidonBuilder::new(opts.width)
				  .sbox(PoseidonSbox::Exponentiation3)
				  .bulletproof_gens(bp_gens)
				  .pedersen_gens(pc_gens)
				  .build();

				let note_generator = PoseidonNoteGeneratorCurve25519 {
				  hasher: poseidon_hasher,
				};
				Ok(note_generator.generate(&self, &mut note_generator.get_rng()).unwrap())*/
				unimplemented!()
			}
			(Backend::Circom, ..) => {
				unimplemented!();
			}
			(Backend::Arkworks, Curve::Bn254) => {
				let note_generator = match note_builder.hash_function {
					HashFunction::Poseidon3 => ArkworksPoseidonBn254NoteGenerator::new(3, 3),
					HashFunction::Poseidon5 => ArkworksPoseidonBn254NoteGenerator::new(5, 3),
					HashFunction::Poseidon17 => ArkworksPoseidonBn254NoteGenerator::new(17, 3),
					HashFunction::MiMCTornado => {
						unreachable!()
					}
				};
				Ok(note_generator
					.generate(&note_builder, &mut note_generator.get_rng())
					.unwrap())
			}
			(Backend::Arkworks, Curve::Bls381) => {
				let note_generator = match note_builder.hash_function {
					HashFunction::Poseidon3 => ArkworksPoseidonBls12_381NoteGenerator::new(3, 3),
					HashFunction::Poseidon5 => ArkworksPoseidonBls12_381NoteGenerator::new(5, 3),
					HashFunction::Poseidon17 => ArkworksPoseidonBls12_381NoteGenerator::new(17, 3),
					HashFunction::MiMCTornado => {
						unreachable!()
					}
				};
				Ok(note_generator
					.generate(&note_builder, &mut note_generator.get_rng())
					.unwrap())
			}
			_ => {
				dbg!(note_builder);
				unimplemented!()
			}
		}
	}

	fn get_leaf_commitment(
		backend: Backend,
		curve: Curve,
		hash_function: HashFunction,
		secrets: &[u8],
	) -> Result<Vec<u8>, ()> {
		match (backend, curve) {
			(_, Curve::Curve25519) => {
				/*				let opts = PoseidonHasherOptions::default();
				let pc_gens = PedersenGens::default();
				let bp_gens = opts.bp_gens.clone().unwrap_or_else(|| BulletproofGens::new(16_400, 1));

				let poseidon_hasher = PoseidonBuilder::new(opts.width)
				  .sbox(PoseidonSbox::Exponentiation3)
				  .bulletproof_gens(bp_gens)
				  .pedersen_gens(pc_gens)
				  .build();

				let note_generator = PoseidonNoteGeneratorCurve25519 {
				  hasher: poseidon_hasher,
				};
				Ok(note_generator.generate(&self, &mut note_generator.get_rng()).unwrap())*/
				unimplemented!()
			}
			(Backend::Circom, ..) => {
				unimplemented!();
			}
			(Backend::Arkworks, Curve::Bn254) => {
				let note_generator = match hash_function {
					HashFunction::Poseidon3 => ArkworksPoseidonBn254NoteGenerator::new(3, 3),
					HashFunction::Poseidon5 => ArkworksPoseidonBn254NoteGenerator::new(5, 3),
					HashFunction::Poseidon17 => ArkworksPoseidonBn254NoteGenerator::new(17, 3),
					HashFunction::MiMCTornado => {
						unreachable!()
					}
				};
				Ok(note_generator.hash(secrets, note_generator.get_params()).unwrap())
			}
			(Backend::Arkworks, Curve::Bls381) => {
				let note_generator = match hash_function {
					HashFunction::Poseidon3 => ArkworksPoseidonBls12_381NoteGenerator::new(3, 3),
					HashFunction::Poseidon5 => ArkworksPoseidonBls12_381NoteGenerator::new(5, 3),
					HashFunction::Poseidon17 => ArkworksPoseidonBls12_381NoteGenerator::new(17, 3),
					HashFunction::MiMCTornado => {
						unreachable!()
					}
				};
				Ok(note_generator.hash(secrets, note_generator.get_params()).unwrap())
			}
			_ => {
				unimplemented!()
			}
		}
	}
}

impl NoteBuilder {
	pub fn generate_note(&self) -> Result<Note, ()> {
		NoteManager::generate(self)
	}
}

impl Default for NoteBuilder {
	fn default() -> Self {
		Self {
			amount: "0".to_string(),
			chain: "any".to_string(),
			backend: Backend::Arkworks,
			denomination: "18".to_string(),
			version: NoteVersion::V1,
			prefix: NOTE_PREFIX.to_owned(),
			group_id: 0,
			curve: Curve::Bn254,
			token_symbol: "EDG".to_string(),
			hash_function: HashFunction::Poseidon3,
		}
	}
}

#[derive(Debug, Eq, PartialEq)]
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
		let parts: Vec<String> = vec![
			//0 => prefix
			self.prefix.clone(),
			//1 => version
			self.version.to_string(),
			//2 => token_symbol
			self.token_symbol.clone(),
			//3 => group_id
			format!("{}", self.group_id),
			//4
			secrets,
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
		if note_val.is_empty() {
			return Err(OpStatusCode::InvalidNoteSecrets);
		}
		let secret: Vec<u8> = hex::decode(&note_val.replace("0x", "")).map_err(|_| OpStatusCode::HexParsingFailed)?;
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
		let note  = "webb.mix-v1-EDG-0-185c1090215e9a66ed3ef8594a7403060df60ac2159537acb10684592d45eb2b16de70eff19a1f80828cf47a5d16502702ff3262acf54cd0b0d0dd7cc67ad415-Bn254-Poseidon3-Arkworks-18-any-0";
		let note = Note::deserialize(note).unwrap();
		assert_eq!(note.prefix.to_string(), "webb.mix".to_string());
		assert_eq!(note.version.to_string(), "v1".to_string());
		assert_eq!(note.token_symbol.to_string(), "EDG".to_string());
		assert_eq!(note.amount.to_string(), "0".to_string());
		assert_eq!(note.hash_function.to_string(), "Poseidon3".to_string());
		assert_eq!(note.backend.to_string(), "Arkworks".to_string());
		assert_eq!(note.denomination.to_string(), "18".to_string());
		assert_eq!(note.chain.to_string(), "any".to_string());
		assert_eq!(note.group_id.to_string(), "0".to_string());
		assert_eq!(note.curve.to_string(), "Bn254".to_string());
	}
	#[test]
	fn generate_note() {
		let mut note_builder = NoteBuilder::default();
		note_builder.backend = Backend::Arkworks;

		note_builder.hash_function = HashFunction::Poseidon17;
		note_builder.curve = Curve::Bn254;
		note_builder.denomination = "18".to_string();
		let note = note_builder.generate_note().unwrap();
		assert_eq!(note.curve, Curve::Bn254);
		assert_eq!(note.backend, Backend::Arkworks);
		assert_eq!(note.denomination, "18".to_string());
		assert_eq!(note.hash_function, HashFunction::Poseidon17);
	}
}
