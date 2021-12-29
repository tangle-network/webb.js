use core::fmt;
use std::str::FromStr;

use crate::note::secrets::get_leaf_with_private_raw;
use crate::types::{Backend, Curve, HashFunction, NotePrefix, NoteVersion, OpStatusCode};

pub mod secrets;

#[derive(Debug, Eq, PartialEq, Clone)]
pub struct Note {
	pub prefix: NotePrefix,
	pub version: NoteVersion,
	pub target_chain_id: String,
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

impl Note {
	/// Deseralize note from a string
	pub fn deserialize(note: &str) -> Result<Self, OpStatusCode> {
		note.parse().map_err(Into::into)
	}

	pub fn get_leaf_and_nullifier(&self) -> Result<(Vec<u8>, Vec<u8>), OpStatusCode> {
		get_leaf_with_private_raw(self.curve, self.width, self.exponentiation, &self.secret)
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

impl FromStr for Note {
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

		Ok(Note {
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

#[cfg(test)]
mod test {
	use ark_ff::{BigInteger, FromBytes, PrimeField};
	use arkworks_circuits::prelude::ark_bn254;
	use arkworks_utils::utils::common::{setup_params_x5_5, Curve as ArkCurve};

	use super::*;

	type Bn254Fr = ark_bn254::Fr;
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
		assert_eq!(note.target_chain_id, "3".to_string());
		assert_eq!(note.source_chain_id, "2".to_string());
	}

	#[test]
	fn generate_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note_value = hex::decode("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717").unwrap();
		let note = Note {
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
			amount: "1".to_string(),
			secret: note_value,
		};
		assert_eq!(note.to_string(), note_str)
	}
	#[test]
	fn generate_leaf() {}
}
