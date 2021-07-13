use core::fmt;
use std::convert::{TryFrom, TryInto};
use std::ops::Deref;
use std::str::FromStr;

use bulletproofs::{BulletproofGens, PedersenGens};
use bulletproofs::r1cs::Prover;
use bulletproofs_gadgets::fixed_deposit_tree::builder::{FixedDepositTree, FixedDepositTreeBuilder};
use bulletproofs_gadgets::poseidon::{Poseidon_hash_2, PoseidonSbox};
use bulletproofs_gadgets::poseidon::builder::{Poseidon, PoseidonBuilder};
use curve25519_dalek::ristretto::CompressedRistretto;
use curve25519_dalek::scalar::Scalar;
use js_sys::{Array, JsString, Uint8Array};
use merlin::Transcript;
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(typescript_type = "Leaves")]
  pub type Leaves;
  #[wasm_bindgen(typescript_type = "Commitments")]
  pub type Commitments;
}

#[wasm_bindgen(typescript_custom_section)]
const LEAVES: &str = "type Leaves = Array<Uint8Array>;";
#[wasm_bindgen(typescript_custom_section)]
const COMMITMENTS: &str = "type Commitments = Array<Uint8Array>;";

const FULL_NOTE_LENGTH: usize = 8;
const PARIETAL_NOTE_LENGTH: usize = 10;

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
  /// Invalid curve  when parsing
  InvalidCurve = 13,
  /// Invalid hashFunction id when parsing
  InvalidHasFunction = 14,
  /// Invalid backend id when parsing
  InvalidBackend = 15,
  /// Invalid denomination id when parsing
  InvalidDenomination = 16,
}

impl From<OpStatusCode> for JsValue {
  fn from(e: OpStatusCode) -> Self {
    JsValue::from(e as u32)
  }
}

const BULLETPROOF_GENS_SIZE: usize = 16_400;
const NOTE_PREFIX: &str = "webb.mix";

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Backend {
  Bulletproofs,
  Arkworks,
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum HashFunction {
  Poseidon3,
  Poseidon5,
  Poseidon17,
  MiMCTornado,
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Curve {
  Bls381,
  Bn254,
  Curve25519,
}

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum NoteVersion {
  V1,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Note {
  #[wasm_bindgen(skip)]
  pub prefix: String,
  pub version: NoteVersion,
  #[wasm_bindgen(skip)]
  pub token_symbol: String,
  pub group_id: u32,
  pub block_number: Option<u32>,
  #[wasm_bindgen(skip)]
  pub r: Scalar,
  #[wasm_bindgen(skip)]
  pub nullifier: Scalar,
  pub curve: Curve,
  pub hash_function: HashFunction,
  pub backend: Backend,
  pub denomination: u32,
}

#[wasm_bindgen]
pub struct ZkProof {
  #[wasm_bindgen(skip)]
  pub comms: Vec<CompressedRistretto>,
  #[wasm_bindgen(skip)]
  pub nullifier_hash: Scalar,
  #[wasm_bindgen(skip)]
  pub proof: Vec<u8>,
  #[wasm_bindgen(skip)]
  pub leaf_index_comms: Vec<CompressedRistretto>,
  #[wasm_bindgen(skip)]
  pub proof_comms: Vec<CompressedRistretto>,
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

impl fmt::Display for Note {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let encoded_r = hex::encode(&self.r.to_bytes());
    let encoded_nullifier = hex::encode(&self.nullifier.to_bytes());
    let mut parts = vec![
      self.prefix.clone(),
      self.version.to_string(),
      self.token_symbol.clone(),
      format!("{}", self.group_id),
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
    let partial = parts.len() == PARIETAL_NOTE_LENGTH;
    let full = parts.len() == FULL_NOTE_LENGTH;
    if !partial && !full {
      return Err(OpStatusCode::InvalidNoteLength);
    }

    if parts[0] != NOTE_PREFIX {
      return Err(OpStatusCode::InvalidNotePrefix);
    }

    let version: NoteVersion = parts[1].parse()?;
    let token_symbol = parts[2].to_owned();
    let group_id = parts[3].parse().map_err(|_| OpStatusCode::InvalidNoteId)?;
    let note_val = match partial {
      true => parts[4],
      false => parts[5],
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
    match partial {
      true => {
        let curve: Curve = parts[5].parse()?;
        let hash_function: HashFunction = parts[6].parse()?;
        let backend: Backend = parts[7].parse()?;
        let denomination: u32 = parts[8].parse().map_err(|_| OpStatusCode::InvalidDenomination)?;
        Ok(Note {
          prefix: NOTE_PREFIX.to_owned(),
          version,
          token_symbol,
          group_id,
          block_number: None,
          r,
          nullifier,
          curve,
          hash_function,
          backend,
          denomination,
        })
      }
      false => {
        let bn: u32 = parts[4].parse().map_err(|_| OpStatusCode::InvalidNoteBlockNumber)?;
        let curve: Curve = parts[6].parse()?;
        let hash_function: HashFunction = parts[7].parse()?;
        let backend: Backend = parts[8].parse()?;
        let denomination: u32 = parts[9].parse().map_err(|_| OpStatusCode::InvalidDenomination)?;
        Ok(Note {
          prefix: NOTE_PREFIX.to_owned(),
          version,
          token_symbol,
          group_id,
          block_number: Some(bn),
          r,
          nullifier,
          curve,
          hash_function,
          backend,
          denomination,
        })
      }
    }
  }
}

#[wasm_bindgen]
impl Note {
  pub fn deserialize(value: JsString) -> Result<Note, JsValue> {
    let note: String = value.into();
    note.parse().map_err(Into::into)
  }

  pub fn serialize(&self) -> JsString {
    let note = self.to_string();
    note.into()
  }

  #[wasm_bindgen(getter)]
  pub fn token_symbol(&self) -> JsString {
    self.token_symbol.clone().into()
  }
}

#[wasm_bindgen]
impl ZkProof {
  #[wasm_bindgen(getter)]
  pub fn proof(&self) -> Uint8Array {
    Uint8Array::from(self.proof.as_slice())
  }

  #[wasm_bindgen(getter)]
  pub fn comms(&self) -> Commitments {
    let list: Array = self
      .comms
      .clone()
      .into_iter()
      .map(|v| Uint8Array::from(v.as_bytes().to_vec().as_slice()))
      .collect();
    let js = JsValue::from(list);
    Commitments::from(js)
  }

  #[wasm_bindgen(getter)]
  pub fn leaf_index_comms(&self) -> Commitments {
    let list: Array = self
      .leaf_index_comms
      .clone()
      .into_iter()
      .map(|v| Uint8Array::from(v.as_bytes().to_vec().as_slice()))
      .collect();
    let js = JsValue::from(list);
    Commitments::from(js)
  }

  #[wasm_bindgen(getter)]
  pub fn proof_comms(&self) -> Commitments {
    let list: Array = self
      .proof_comms
      .clone()
      .into_iter()
      .map(|v| Uint8Array::from(v.as_bytes().to_vec().as_slice()))
      .collect();
    let js = JsValue::from(list);
    Commitments::from(js)
  }

  #[wasm_bindgen(getter)]
  pub fn nullifier_hash(&self) -> Uint8Array {
    ScalarWrapper(self.nullifier_hash).into()
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
    let bp_gens =
      bincode::deserialize(&value.to_vec()).unwrap_or_else(|_| BulletproofGens::new(BULLETPROOF_GENS_SIZE, 1));
    self.bp_gens = Some(bp_gens);
  }

  #[wasm_bindgen(getter)]
  pub fn bp_gens(&self) -> Uint8Array {
    let val = self
      .bp_gens
      .clone()
      .unwrap_or_else(|| BulletproofGens::new(BULLETPROOF_GENS_SIZE, 1));
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
    let pc_gens = PedersenGens::default();
    let bp_gens = opts
      .bp_gens
      .clone()
      .unwrap_or_else(|| BulletproofGens::new(BULLETPROOF_GENS_SIZE, 1));

    let inner = PoseidonBuilder::new(opts.width)
      .sbox(PoseidonSbox::Exponentiation3)
      .bulletproof_gens(bp_gens)
      .pedersen_gens(pc_gens)
      .build();
    Self { inner }
  }

  pub fn hash(&self, left: Uint8Array, right: Uint8Array) -> Result<Uint8Array, JsValue> {
    let xl = ScalarWrapper::try_from(left)?;
    let xr = ScalarWrapper::try_from(right)?;
    let hash = Poseidon_hash_2(*xl, *xr, &self.inner);
    Ok(ScalarWrapper(hash).into())
  }
}

#[wasm_bindgen]
pub struct PoseidonNoteGenerator {
  hasher: Poseidon,
  rng: OsRng,
}


trait NoteGen {
  fn nullifier_hash_of(&self, note: &Note) -> Uint8Array;
  fn generate(&mut self, token_symbol: String, group_id: u32) -> Note;
  fn leaf_of(&self, note: &Note) -> Uint8Array;
}

#[wasm_bindgen]
struct NoteGenerator<T: NoteGen> {
  inner: T,
}


#[wasm_bindgen]
impl NoteGenerator<T> {
  #[wasm_bindgen(constructor)]
  pub fn new(inner: T) -> NoteGenerator<T> {
    NoteGenerator {
      inner
    }
  }
  pub fn nullifier_hash_of(&self, note: &Note) -> Uint8Array {
    T::nullifier_hash_of(self, note)
  }
  pub fn generate(&mut self, token_symbol: JsValue, group_id: u32) -> Uint8Array {
    T::generate(self, token_symbol.into(), group_id)
  }
  pub fn leaf_of(&self, note: &Note) -> Uint8Array {
    T::leaf_of(self, note)
  }
}

impl NoteGen for PoseidonNoteGenerator {
  fn generate(&mut self, token_symbol: String, group_id: u32) -> Note {
    let r = Scalar::random(&mut self.rng);
    let nullifier = Scalar::random(&mut self.rng);
    Note {
      prefix: NOTE_PREFIX.to_string(),
      version: NoteVersion::V1,
      token_symbol: token_symbol.into(),
      block_number: None,
      group_id,
      r,
      nullifier,

      curve: Curve::Bls381,
      hash_function: HashFunction::Poseidon3,
      backend: Backend::Bulletproofs,
      denomination: 16,
    }
  }
  fn leaf_of(&self, note: &Note) -> Uint8Array {
    let leaf = Poseidon_hash_2(note.r, note.nullifier, &self.hasher);
    ScalarWrapper(leaf).into()
  }

  fn nullifier_hash_of(&self, note: &Note) -> Uint8Array {
    let hash = Poseidon_hash_2(note.nullifier, note.nullifier, &self.hasher);
    ScalarWrapper(hash).into()
  }
}

#[wasm_bindgen]
impl PoseidonNoteGenerator {
  #[wasm_bindgen(constructor)]
  pub fn new(hasher: &PoseidonHasher) -> Self {
    Self {
      hasher: hasher.inner.clone(),
      rng: OsRng::default(),
    }
  }

  pub fn generate(&mut self, token_symbol: JsString, group_id: u32) -> Note {
    let r = Scalar::random(&mut self.rng);
    let nullifier = Scalar::random(&mut self.rng);
    Note {
      prefix: NOTE_PREFIX.to_string(),
      version: NoteVersion::V1,
      token_symbol: token_symbol.into(),
      block_number: None,
      group_id,
      r,
      nullifier,

      curve: Curve::Bls381,
      hash_function: HashFunction::Poseidon3,
      backend: Backend::Bulletproofs,
      denomination: 16,
    }
  }

  pub fn leaf_of(&self, note: &Note) -> Uint8Array {
    let leaf = Poseidon_hash_2(note.r, note.nullifier, &self.hasher);
    ScalarWrapper(leaf).into()
  }

  pub fn nullifier_hash_of(&self, note: &Note) -> Uint8Array {
    let hash = Poseidon_hash_2(note.nullifier, note.nullifier, &self.hasher);
    ScalarWrapper(hash).into()
  }
}

#[wasm_bindgen]
pub struct MerkleTree {
  inner: FixedDepositTree,
  hasher: Poseidon,
}

#[wasm_bindgen]
impl MerkleTree {
  #[wasm_bindgen(constructor)]
  pub fn new(depth: u8, hasher: &PoseidonHasher) -> Self {
    let tree = FixedDepositTreeBuilder::new()
      .hash_params(hasher.inner.clone())
      .depth(depth as usize)
      .build();
    Self {
      inner: tree,
      hasher: hasher.inner.clone(),
    }
  }

  pub fn add_leaf_at_index(&mut self, leaf: Uint8Array, index: u64) -> Result<(), JsValue> {
    let idx = Scalar::from(index);
    let leaf = ScalarWrapper::try_from(leaf)?;
    self.inner.tree.update(idx, *leaf);
    Ok(())
  }

  pub fn add_leaves(&mut self, leaves: Leaves, target_root: Option<Uint8Array>) -> Result<(), JsValue> {
    let xs = Array::from(&leaves)
      .to_vec()
      .into_iter()
      .map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
      .map(ScalarWrapper::try_from)
      .collect::<Result<Vec<_>, _>>()?
      .into_iter()
      .map(|v| v.to_bytes())
      .collect();
    let root = target_root
      .map(ScalarWrapper::try_from)
      .transpose()?
      .map(|v| v.to_bytes());
    self.inner.tree.add_leaves(xs, root);
    Ok(())
  }

  pub fn root(&self) -> Uint8Array {
    let root = self.inner.tree.root;
    Uint8Array::from(root.to_bytes().to_vec().as_slice())
  }

  pub fn create_zk_proof(
    &mut self,
    root: Uint8Array,
    recipient: Uint8Array,
    relayer: Uint8Array,
    note: &Note,
  ) -> Result<ZkProof, JsValue> {
    let leaf = Poseidon_hash_2(note.r, note.nullifier, &self.hasher);
    let root = ScalarWrapper::try_from(root)?;
    let recipient = ScalarWrapper::try_from(recipient)?;
    let relayer = ScalarWrapper::try_from(relayer)?;
    // add the current leaf we need to prove to the secrets.
    let nullifier_hash = Poseidon_hash_2(note.nullifier, note.nullifier, &self.hasher);
    self.inner.add_secrets(leaf, note.r, note.nullifier, nullifier_hash);

    let pc_gens = PedersenGens::default();
    let bp_gens = self.hasher.bp_gens.clone();
    let mut prover_transcript = Transcript::new(b"zk_membership_proof");
    let prover = Prover::new(&pc_gens, &mut prover_transcript);

    let (proof, (comms, nullifier_hash, leaf_index_comms, proof_comms)) =
      self.inner.prove_zk(*root, leaf, *recipient, *relayer, &bp_gens, prover);
    let zkproof = ZkProof {
      proof: proof.to_bytes(),
      comms,
      leaf_index_comms,
      proof_comms,
      nullifier_hash,
    };

    Ok(zkproof)
  }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct ScalarWrapper(Scalar);

impl Deref for ScalarWrapper {
  type Target = Scalar;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl TryFrom<Uint8Array> for ScalarWrapper {
  type Error = OpStatusCode;

  fn try_from(value: Uint8Array) -> Result<Self, Self::Error> {
    let bytes: [u8; 32] = value
      .to_vec()
      .try_into()
      .map_err(|_| OpStatusCode::InvalidArrayLength)?;
    Ok(Self(Scalar::from_bytes_mod_order(bytes)))
  }
}

#[allow(clippy::from_over_into)]
impl Into<Uint8Array> for ScalarWrapper {
  fn into(self) -> Uint8Array {
    Uint8Array::from(self.0.to_bytes().to_vec().as_slice())
  }
}

#[wasm_bindgen(start)]
pub fn wasm_init() -> Result<(), JsValue> {
  console_error_panic_hook::set_once();
  Ok(())
}

#[cfg(test)]
mod tests {
  use lazy_static::lazy_static;
  use rand::rngs::OsRng;
  use wasm_bindgen_test::*;

  use super::*;

  wasm_bindgen_test_configure!(run_in_browser);

  lazy_static! {
		static ref HASHER: PoseidonHasher = PoseidonHasher::default();
	}

  #[wasm_bindgen_test]
  fn init_hasher() {
    let mut rng = OsRng::default();
    let a = Scalar::random(&mut rng);
    let b = Scalar::random(&mut rng);
    let hash = HASHER.hash(
      Uint8Array::from(a.to_bytes().to_vec().as_slice()),
      Uint8Array::from(b.to_bytes().to_vec().as_slice()),
    );

    assert!(hash.is_ok());

    let x = Uint8Array::from(Vec::new().as_slice());
    let y = Uint8Array::from(Vec::new().as_slice());
    let hash = HASHER.hash(x, y);
    assert_eq!(hash.err(), Some(OpStatusCode::InvalidArrayLength.into()));
  }

  #[wasm_bindgen_test]
  fn generate_note() {
    let mut ng = PoseidonNoteGenerator::new(&HASHER);
    let note = ng.generate(JsString::from("EDG"), 0);
    assert_eq!(note.group_id, 0);
    assert_eq!(note.token_symbol, "EDG");
  }

  #[wasm_bindgen_test]
  fn zk_proof() {
    let mut rng = OsRng::default();
    let mut ng = PoseidonNoteGenerator::new(&HASHER);
    let note = ng.generate(JsString::from("EDG"), 0);
    let my_leaf = ScalarWrapper::try_from(ng.leaf_of(&note)).unwrap();

    let mut mt = MerkleTree::new(32, &HASHER);
    let mut leaves: Vec<_> = vec![Scalar::random(&mut rng); 7].iter().map(Scalar::to_bytes).collect();
    leaves[3] = my_leaf.to_bytes();
    mt.inner.tree.add_leaves(leaves, None);

    let recipient = ScalarWrapper(Scalar::zero());
    let relayer = ScalarWrapper(Scalar::zero());
    let zk_proof = mt.create_zk_proof(mt.root(), recipient.into(), relayer.into(), &note);
    assert!(zk_proof.is_ok());
  }
}
