use core::fmt;
use std::str::FromStr;

use arkworks_utils::prelude::ark_bn254;
use rand::rngs::OsRng;

use crate::note::arkworks_poseidon_bls12_381::ArkworksPoseidonBls12_381NoteGenerator;
use crate::note::arkworks_poseidon_bn254::ArkworksPoseidonBn254NoteGenerator;
use crate::types::{Backend, Curve, HashFunction, NotePrefix, NoteVersion, OpStatusCode};

mod arkworks_poseidon_bls12_381;
mod arkworks_poseidon_bn254;

const FULL_NOTE_LENGTH: usize = 13;
const NOTE_PREFIX: &str = "webb.mix";
const BRIDGE_NOTE_PREFIX: &str = "webb.bridge";

pub trait NoteGenerator {
	type Rng;
	fn get_rng(&self) -> Self::Rng;

	fn generate_secrets(&self, r: &mut Self::Rng) -> Result<Vec<u8>, OpStatusCode>;
	fn generate(&self, note_input: NoteInput, r: &mut Self::Rng) -> Result<Note, OpStatusCode> {
		let secrets = Self::generate_secrets(self, r).map_err(|_| OpStatusCode::SecretGenFailed)?;
		Note::generate_with_secrets(note_input, secrets)
	}
}

pub trait LeafHasher {
	const SECRET_LENGTH: usize;
	type HasherOptions: Clone;
	fn hash(&self, secrets: &[u8], options: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode>;
}

pub trait NoteSecretGenerator {
	fn generate_secrets(width: usize, exponentiation: usize, rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode>;
}

#[derive(Debug)]
pub struct NoteInput {
	pub prefix: NotePrefix,
	pub version: NoteVersion,
	pub chain_id: String,
	pub source_chain_id: String,
	/// zkp related items
	pub backend: Backend,
	pub hash_function: HashFunction,
	pub curve: Curve,
	pub token_symbol: String,
	pub amount: String,
	pub denomination: u8,
	pub exponentiation: i8,
	pub width: usize,
}

impl Default for NoteInput {
	fn default() -> Self {
		Self {
			amount: "0".to_string(),
			chain_id: "any".to_string(),
			source_chain_id: "any".to_string(),
			backend: Backend::Arkworks,
			denomination: 18,
			version: NoteVersion::V1,
			prefix: NotePrefix::Mixer,
			exponentiation: 5,
			curve: Curve::Bn254,
			token_symbol: "EDG".to_string(),
			hash_function: HashFunction::Poseidon,
			width: 5,
		}
	}
}

#[derive(Debug, Eq, PartialEq, Clone)]
pub struct Note {
	pub prefix: NotePrefix,
	pub version: NoteVersion,
	pub chain_id: String,
	pub source_chain_id: String,

	/// zkp related items
	pub backend: Backend,
	pub hash_function: HashFunction,
	pub curve: Curve,
	pub exponentiation: i8,
	pub width: usize,
	/// mixer related items
	pub secret: Vec<u8>,

	pub token_symbol: String,
	pub amount: String,
	pub denomination: u8,
}
type Bn254Fr = ark_bn254::Fr;

impl Note {
	/// Deseralize note from a string
	pub fn deserialize(note: &str) -> Result<Self, OpStatusCode> {
		note.parse().map_err(Into::into)
	}

	/// generate the note with pre generated secrets
	pub fn generate_with_secrets(note_input: NoteInput, secrets: Vec<u8>) -> Result<Self, OpStatusCode> {
		let note = Self {
			prefix: note_input.prefix,
			exponentiation: note_input.exponentiation,
			width: note_input.width,
			denomination: note_input.denomination,
			secret: secrets,
			version: note_input.version,
			chain_id: note_input.chain_id,
			source_chain_id: note_input.source_chain_id,
			backend: note_input.backend,
			hash_function: note_input.hash_function,
			curve: note_input.curve,
			token_symbol: note_input.token_symbol,
			amount: note_input.amount,
		};
		Ok(note)
	}

	pub fn generate_note(note_builder: NoteInput) -> Result<Self, OpStatusCode> {
		let mut rng = OsRng;
		let width = note_builder.width;
		let exponentiation = note_builder.exponentiation as usize;
		let secrets = match (note_builder.backend, note_builder.curve) {
			(Backend::Arkworks, Curve::Bls381) => {
				ArkworksPoseidonBls12_381NoteGenerator::generate_secrets(width, exponentiation, &mut rng)
			}
			(Backend::Arkworks, Curve::Bn254) => {
				ArkworksPoseidonBn254NoteGenerator::generate_secrets(width, exponentiation, &mut rng)
			}
			_ => {
				unimplemented!("Curve25519 isn't implemented")
			}
		}
		.map_err(|_| OpStatusCode::SecretGenFailed)?;
		Self::generate_with_secrets(note_builder, secrets)
	}
}

impl fmt::Display for Note {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		let secrets = hex::encode(&self.secret);
		let parts: Vec<String> = vec![
			//0 => prefix
			self.prefix.to_string(),
			//1 => version
			self.version.to_string(),
			//2 => chain
			self.chain_id.to_string(),
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

impl FromStr for Note {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		let parts: Vec<&str> = s.split(':').collect();
		let prefix = parts[0].parse()?;
		let version: NoteVersion = parts[1].parse()?;
		let chain_id = parts[2].to_string();
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

		Ok(Note {
			prefix,
			version,
			chain_id,
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

#[cfg(test)]
mod test {
	use ark_ff::{to_bytes, BigInteger, FromBytes, PrimeField};
	use arkworks_circuits::prelude::ark_bn254;
	use arkworks_circuits::setup::common::setup_tree_and_create_path_tree_x5;
	use arkworks_circuits::setup::mixer::setup_leaf_x5;
	use arkworks_utils::poseidon::PoseidonParameters;
	use arkworks_utils::utils::common::{setup_params_x5_3, setup_params_x5_5, Curve as ArkCurve};

	use super::*;

	type Bn254Fr = ark_bn254::Fr;

	pub fn get_hash_params<T: PrimeField>(curve: ArkCurve) -> (Vec<u8>, Vec<u8>) {
		(
			setup_params_x5_3::<T>(curve).to_bytes(),
			setup_params_x5_5::<T>(curve).to_bytes(),
		)
	}
	pub fn get_leaf() -> (Vec<u8>, Vec<u8>) {
		let rng = &mut ark_std::test_rng();

		let (_, params5) = get_hash_params::<Bn254Fr>(ArkCurve::Bn254);
		let params5_deserialized = PoseidonParameters::<Bn254Fr>::from_bytes(&*params5).unwrap();
		let (leaf_private, leaf, _) = setup_leaf_x5(&params5_deserialized, rng);
		let private_bytes = to_bytes![leaf_private.secret(), leaf_private.nullifier()].unwrap();
		let leaf_element = leaf.into_repr().to_bytes_le();

		(private_bytes, leaf_element)
	}

	#[test]
	fn deserialize() {
		let note = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = Note::deserialize(note).unwrap();
		assert_eq!(note.prefix, NotePrefix::Bridge);
		assert_eq!(note.backend, Backend::Arkworks);
		assert_eq!(note.curve, Curve::Bn254);
		assert_eq!(note.hash_function, HashFunction::Poseidon);
		assert_eq!(note.token_symbol, String::from("EDG"));
		assert_eq!(note.denomination, 18);
		assert_eq!(note.version, NoteVersion::V1);
		assert_eq!(note.width, 5);
		assert_eq!(note.exponentiation, 5);
		assert_eq!(note.chain_id, "3".to_string());
		assert_eq!(note.source_chain_id, "2".to_string());
	}

	#[test]
	fn generate_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let mut note_input = NoteInput::default();
		note_input.prefix = NotePrefix::Bridge;
		note_input.version = NoteVersion::V1;
		note_input.chain_id = "3".to_string();
		note_input.source_chain_id = "2".to_string();

		note_input.width = 5;
		note_input.exponentiation = 5;
		note_input.denomination = 18;

		note_input.token_symbol = "EDG".to_string();
		note_input.hash_function = HashFunction::Poseidon;
		note_input.curve = Curve::Bn254;
		let note_value = hex::decode("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717").unwrap();
		let note = Note::generate_with_secrets(note_input, note_value).unwrap();
		assert_eq!(note.to_string(), note_str)
	}
	#[test]
	fn generate_leaf() {
		let mut note_builder = NoteInput::default();
		note_builder.backend = Backend::Arkworks;
	}
}
