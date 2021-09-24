use core::fmt;
use std::str::FromStr;

use crate::note::arkworks_poseidon_bls12_381::ArkworksPoseidonBls12_381NoteGenerator;
use crate::note::arkworks_poseidon_bn254::ArkworksPoseidonBn254NoteGenerator;
use crate::types::{Backend, Curve, HashFunction, NoteVersion, OpStatusCode};

mod arkworks_poseidon_bls12_381;
mod arkworks_poseidon_bn254;

const FULL_NOTE_LENGTH: usize = 12;
const NOTE_PREFIX: &str = "webb.mix";
const BRIDGE_NOTE_PREFIX: &str = "webb.bridge";

fn generate_with_secrets(note_builder: &NoteBuilder, secrets: &[u8]) -> Result<Note, OpStatusCode> {
  Ok(Note {
    prefix: note_builder.prefix.clone(),
    version: note_builder.version,
    chain: note_builder.chain.clone(),
    source_chain:note_builder.source_chain.clone(),
    backend: note_builder.backend,
    curve: note_builder.curve,
    hash_function: note_builder.hash_function,
    token_symbol: note_builder.token_symbol.clone(),
    amount: note_builder.amount.clone(),
    denomination: note_builder.denomination.clone(),
    secret: secrets.to_vec(),
    exponentiation: note_builder.exponentiation.clone(),
    width: note_builder.width.clone(),
  })
}

pub trait NoteGenerator {
  type Rng;
  fn get_rng(&self) -> Self::Rng;

  fn generate_secrets(&self, r: &mut Self::Rng) -> Result<Vec<u8>, OpStatusCode>;
  fn generate(&self, note_builder: &NoteBuilder, r: &mut Self::Rng) -> Result<Note, OpStatusCode> {
    let secrets = Self::generate_secrets(self, r).map_err(|_| OpStatusCode::SecretGenFailed)?;
    generate_with_secrets(note_builder, &secrets)
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
  pub source_chain:String,
  /// zkp related items
  pub backend: Backend,
  pub hash_function: HashFunction,
  pub curve: Curve,
  pub token_symbol: String,
  pub amount: String,
  pub denomination: String,
  pub exponentiation: String,
  pub width: String,
  pub secrets: Option<Vec<u8>>,
}

struct NoteManager;

impl NoteManager {
  fn generate(note_builder: &NoteBuilder) -> Result<Note, ()> {
    let width = get_usize_from_string(&note_builder.width);
    let exponentiation = get_usize_from_string(&note_builder.exponentiation);
    match (note_builder.backend, note_builder.curve) {
      (_, Curve::Curve25519) => match &note_builder.secrets {
        None => {
          unimplemented!();
        }
        Some(secrets) => return generate_with_secrets(note_builder, secrets.as_slice()).map_err(|_| ()),
      },
      (Backend::Circom, ..) => match &note_builder.secrets {
        None => {
          unimplemented!();
        }
        Some(secrets) => return generate_with_secrets(note_builder, secrets.as_slice()).map_err(|_| ()),
      },
      (Backend::Arkworks, Curve::Bn254) => {
        let note_generator = match note_builder.hash_function {
          HashFunction::Poseidon => ArkworksPoseidonBn254NoteGenerator::new(width, exponentiation),
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
          HashFunction::Poseidon => ArkworksPoseidonBls12_381NoteGenerator::new(width, exponentiation),
          HashFunction::MiMCTornado => {
            unreachable!()
          }
        };
        Ok(note_generator
          .generate(&note_builder, &mut note_generator.get_rng())
          .unwrap())
      }
    }
  }

  fn get_leaf_commitment(note: &Note) -> Result<Vec<u8>, ()> {
    let Note {
      secret: secrets,
      backend,
      curve,
      hash_function,
      width,
      exponentiation,
      ..
    } = note;
    let width = get_usize_from_string(width);
    let exponentiation = get_usize_from_string(exponentiation);
    match (backend, curve) {
      (_, Curve::Curve25519) => {
        unimplemented!()
      }
      (Backend::Circom, ..) => {
        unimplemented!();
      }
      (Backend::Arkworks, Curve::Bn254) => {
        let note_generator = match hash_function {
          HashFunction::Poseidon => ArkworksPoseidonBls12_381NoteGenerator::new(width, exponentiation),
          HashFunction::MiMCTornado => {
            unreachable!()
          }
        };
        Ok(note_generator.hash(secrets, note_generator.get_params()).unwrap())
      }
      (Backend::Arkworks, Curve::Bls381) => {
        let note_generator = match hash_function {
          HashFunction::Poseidon => ArkworksPoseidonBls12_381NoteGenerator::new(width, exponentiation),
          HashFunction::MiMCTornado => {
            unreachable!()
          }
        };
        Ok(note_generator.hash(secrets, note_generator.get_params()).unwrap())
      }
    }
  }
}

fn get_usize_from_string(s: &str) -> usize {
  s.parse().unwrap()
}

impl NoteBuilder {
  pub fn generate_note(&self) -> Result<Note, ()> {
    NoteManager::generate(self)
  }

  pub fn get_leaf(note: &Note) -> Result<Vec<u8>, ()> {
    NoteManager::get_leaf_commitment(note)
  }
}

impl Default for NoteBuilder {
  fn default() -> Self {
    Self {
      amount: "0".to_string(),
      chain: "any".to_string(),
      source_chain:"any".to_string(),
      backend: Backend::Arkworks,
      denomination: "18".to_string(),
      version: NoteVersion::V1,
      prefix: NOTE_PREFIX.to_owned(),
      exponentiation: "5".to_string(),
      curve: Curve::Bn254,
      token_symbol: "EDG".to_string(),
      hash_function: HashFunction::Poseidon,
      width: "5".to_string(),
      secrets: None,
    }
  }
}

#[derive(Debug, Eq, PartialEq, Clone)]
pub struct Note {
  pub prefix: String,
  pub version: NoteVersion,
  pub chain: String,
  pub source_chain: String,

  /// zkp related items
  pub backend: Backend,
  pub hash_function: HashFunction,
  pub curve: Curve,
  pub exponentiation: String,
  pub width: String,
  /// mixer related items
  pub secret: Vec<u8>,

  pub token_symbol: String,
  pub amount: String,
  pub denomination: String,
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
      //2 => chain
      self.chain.clone(),
      //3 => chain
      self.source_chain.clone(),
      //4 => backend
      self.backend.to_string(),
      //5 => curve
      self.curve.to_string(),
      //6 => hash_function
      self.hash_function.to_string(),
      //7 => token_symbol
      self.token_symbol.clone(),
      //8 => denomination
      self.denomination.clone(),
      //9 => amount
      self.amount.clone(),
      // 10
      self.exponentiation.clone(),
      // 11
      self.width.clone(),
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
    let full = parts.len() == FULL_NOTE_LENGTH;
    if !full {
      return Err(OpStatusCode::InvalidNoteLength);
    }
    let prefix = parts[0];

    if prefix != NOTE_PREFIX && prefix != BRIDGE_NOTE_PREFIX {
      return Err(OpStatusCode::InvalidNotePrefix);
    }

    let version: NoteVersion = parts[1].parse()?;
    let chain = parts[2].to_string();
    let source_chain = parts[3].to_string();
    let backend: Backend = parts[4].parse()?;
    let curve: Curve = parts[5].parse()?;
    let hash_function: HashFunction = parts[6].parse()?;
    let token_symbol = parts[7].to_owned();
    let denomination = parts[8].to_string();
    let amount = parts[9].to_string();
    let exponentiation = parts[10].to_string();
    let width = parts[11].to_string();
    let note_val = parts[12];

    if note_val.is_empty() {
      return Err(OpStatusCode::InvalidNoteSecrets);
    }
    let secret: Vec<u8> = hex::decode(&note_val.replace("0x", "")).map_err(|_| OpStatusCode::HexParsingFailed)?;


    Ok(Note {
      prefix: prefix.to_owned(),
      version,
      chain,
      source_chain,
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
  use super::*;

  #[test]
  fn deserialize() {
    let note = "webb.bridge:v1:any:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";

    let note = Note::deserialize(note).unwrap();
    assert_eq!(note.version.to_string(), "v1".to_string());
    assert_eq!(note.token_symbol.to_string(), "EDG".to_string());
    assert_eq!(note.amount.to_string(), "0".to_string());
    assert_eq!(note.hash_function.to_string(), "Poseidon".to_string());
    assert_eq!(note.backend.to_string(), "Arkworks".to_string());
    assert_eq!(note.denomination.to_string(), "18".to_string());
    assert_eq!(note.chain.to_string(), "any".to_string());
    assert_eq!(note.curve.to_string(), "Bn254".to_string());
  }

  #[test]
  fn generate_note() {
    let mut note_builder = NoteBuilder::default();
    note_builder.backend = Backend::Arkworks;

    note_builder.hash_function = HashFunction::Poseidon;
    note_builder.curve = Curve::Bn254;
    note_builder.denomination = "18".to_string();
    let note = note_builder.generate_note().unwrap();
    assert_eq!(note.curve, Curve::Bn254);
    assert_eq!(note.backend, Backend::Arkworks);
    assert_eq!(note.denomination, "18".to_string());
    assert_eq!(note.hash_function, HashFunction::Poseidon);
    dbg!(note.to_string());
  }
}
