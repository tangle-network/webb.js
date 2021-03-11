use core::fmt;
use std::convert::TryInto;
use std::str::FromStr;

use bulletproofs::{BulletproofGens, PedersenGens};
use curve25519_dalek::scalar::Scalar;
use curve25519_gadgets::poseidon::builder::{Poseidon, PoseidonBuilder};
use curve25519_gadgets::poseidon::{PoseidonSbox, Poseidon_hash_2};
use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Returns a Status Code for the operation.
#[wasm_bindgen]
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
}

impl From<OpStatusCode> for JsValue {
	fn from(e: OpStatusCode) -> Self {
		JsValue::from(e as u32)
	}
}

const NOTE_PREFIX: &str = "webb.mix";

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum NoteVersion {
	V1,
}

#[derive(Clone)]
pub struct Note {
	pub prefix: String,
	pub version: NoteVersion,
	pub token_symbol: String,
	pub mixer_id: u32,
	pub block_number: Option<u32>,
	r: Scalar,
	nullifier: Scalar,
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

impl fmt::Display for Note {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		let encoded_r = hex::encode(&self.r.to_bytes());
		let encoded_nullifier = hex::encode(&self.nullifier.to_bytes());
		let mut parts = vec![
			self.prefix.clone(),
			self.version.to_string(),
			self.token_symbol.clone(),
			format!("{}", self.mixer_id),
		];
		if let Some(bn) = self.block_number {
			parts.push(format!("{}", bn));
		}
		parts.push(format!("{}{}", encoded_r, encoded_nullifier));
		let note = parts.join("-");
		write!(f, "{}", note)
	}
}

impl FromStr for Note {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		let parts: Vec<&str> = s.split('-').collect();
		let partial = parts.len() == 5;
		let full = parts.len() == 6;
		if !partial && !full {
			return Err(OpStatusCode::InvalidNoteLength);
		}

		if parts[0] != NOTE_PREFIX {
			return Err(OpStatusCode::InvalidNotePrefix);
		}

		let version: NoteVersion = parts[1].parse()?;
		let token_symbol = parts[2].to_owned();
		let mixer_id = parts[3].parse().map_err(|_| OpStatusCode::InvalidNoteId)?;
		let (block_number, note_val) = match partial {
			true => (None, parts[4]),
			false => {
				let bn = parts[4].parse().map_err(|_| OpStatusCode::InvalidNoteBlockNumber)?;
				(Some(bn), parts[5])
			}
		};
		if note_val.len() != 128 {
			return Err(OpStatusCode::InvalidNoteSecrets);
		}

		let r = hex::decode(&note_val[..64])
			.map(|v| v.try_into())
			.map(|r| r.map(Scalar::from_bytes_mod_order))
			.map_err(|_| OpStatusCode::InvalidHexLength)?
			.map_err(|_| OpStatusCode::HexParsingFailed)?;
		let nullifier = hex::decode(&note_val[64..])
			.map(|v| v.try_into())
			.map(|r| r.map(Scalar::from_bytes_mod_order))
			.map_err(|_| OpStatusCode::InvalidHexLength)?
			.map_err(|_| OpStatusCode::HexParsingFailed)?;
		Ok(Note {
			prefix: NOTE_PREFIX.to_owned(),
			version,
			token_symbol,
			mixer_id,
			block_number,
			r,
			nullifier,
		})
	}
}

#[wasm_bindgen]
pub struct PoseidonHasherOptions {
	/// The size of the permutation, in field elements.
	width: usize,
	/// Number of full SBox rounds in beginning
	pub full_rounds_beginning: Option<usize>,
	/// Number of full SBox rounds in end
	pub full_rounds_end: Option<usize>,
	/// Number of partial rounds
	pub partial_rounds: Option<usize>,
	/// The desired (classical) security level, in bits.
	pub security_bits: Option<usize>,
	/// Bulletproof generators for proving/verifying (serialized)
	#[wasm_bindgen(skip)]
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

#[wasm_bindgen]
impl PoseidonHasherOptions {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	#[wasm_bindgen(setter)]
	pub fn set_bp_gens(&mut self, value: Uint8Array) {
		let bp_gens: BulletproofGens =
			bincode::deserialize(&value.to_vec()).unwrap_or_else(|_| BulletproofGens::new(16400, 1));
		self.bp_gens = Some(bp_gens);
	}

	#[wasm_bindgen(getter)]
	pub fn bp_gens(&self) -> Uint8Array {
		let val = self.bp_gens.clone().unwrap_or_else(|| BulletproofGens::new(16400, 1));
		let serialized = bincode::serialize(&val).unwrap_or_else(|_| Vec::new());
		Uint8Array::from(serialized.as_slice())
	}
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct PoseidonHasher {
	inner: Poseidon,
}

#[wasm_bindgen]
impl PoseidonHasher {
	pub fn default() -> Self {
		Self::with_options(Default::default())
	}

	#[wasm_bindgen(constructor)]
	pub fn with_options(opts: PoseidonHasherOptions) -> Self {
		// default pedersen genrators
		let pc_gens = PedersenGens::default();
		let bp_gens = opts.bp_gens.clone().unwrap_or_else(|| BulletproofGens::new(16400, 1));

		let inner = PoseidonBuilder::new(opts.width)
			.sbox(PoseidonSbox::Exponentiation3)
			.bulletproof_gens(bp_gens)
			.pedersen_gens(pc_gens)
			.build();
		Self { inner }
	}

	pub fn hash(&self, left: Uint8Array, right: Uint8Array) -> Result<Uint8Array, JsValue> {
		let xl: [u8; 32] = left.to_vec().try_into().map_err(|_| OpStatusCode::InvalidArrayLength)?;
		let xr: [u8; 32] = right
			.to_vec()
			.try_into()
			.map_err(|_| OpStatusCode::InvalidArrayLength)?;
		let hash = Poseidon_hash_2(
			Scalar::from_bytes_mod_order(xl),
			Scalar::from_bytes_mod_order(xr),
			&self.inner,
		);
		Ok(Uint8Array::from(hash.to_bytes().to_vec().as_slice()))
	}
}

#[wasm_bindgen(start)]
pub fn wasm_init() -> Result<(), JsValue> {
	// This provides better error messages in debug mode.
	// It's disabled in release mode so it doesn't bloat up the file size.
	#[cfg(debug_assertions)]
	console_error_panic_hook::set_once();
	Ok(())
}

#[cfg(test)]
mod tests {
	use super::*;
	use rand::rngs::OsRng;
	use wasm_bindgen_test::*;

	wasm_bindgen_test_configure!(run_in_browser);

	#[wasm_bindgen_test]
	fn init_hasher() {
		let mut rng = OsRng::default();
		let opts = PoseidonHasherOptions::new();
		let hasher = PoseidonHasher::with_options(opts);
		let a = Scalar::random(&mut rng);
		let b = Scalar::random(&mut rng);
		let hash = hasher.hash(
			Uint8Array::from(a.to_bytes().to_vec().as_slice()),
			Uint8Array::from(b.to_bytes().to_vec().as_slice()),
		);

		assert!(hash.is_ok());

		let x = Uint8Array::from(Vec::new().as_slice());
		let y = Uint8Array::from(Vec::new().as_slice());
		let hash = hasher.hash(x, y);
		assert_eq!(hash.err(), Some(OpStatusCode::InvalidArrayLength.into()));
	}
}
