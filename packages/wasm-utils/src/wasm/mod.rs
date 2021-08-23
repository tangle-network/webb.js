use std::convert::{TryFrom, TryInto};
use std::ops::Deref;

use ark_ff::ToBytes;
use ark_serialize::CanonicalSerialize;
use js_sys::{Array, JsString, SharedArrayBuffer, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::note::note::{Note, NoteBuilder};
use crate::proof::{ZKProof, ZkProofBuilder};
use crate::types::{Backend, Curve as NoteCurve, HashFunction, NoteVersion, OpStatusCode};

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type = "Curve")]
	pub type Curve;

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
const LEAVES: &str = "type Leaves = Array<Uint8Array>;";

#[wasm_bindgen(typescript_custom_section)]
const HF: &str = "type HashFunction = 'Poseidon3'|'Poseidon5'|'Poseidon17 '|'MiMCTornado'";

#[wasm_bindgen(typescript_custom_section)]
const CURVE: &str = "type Curve = 'Bls381'|'Bn254' |'Curve25519'";

#[wasm_bindgen(typescript_custom_section)]
const VERSION: &str = "type Version = 'v1'";

#[wasm_bindgen(typescript_custom_section)]
const BE: &str = "type Backend = 'Bulletproofs'|'Arkworks'|'Circom'";
#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct DepositNote {
	note: Note,
}

#[wasm_bindgen]
pub struct NoteBuilderInput {
	note_builder: NoteBuilder,
}

impl Default for NoteBuilderInput {
	fn default() -> Self {
		Self {
			note_builder: NoteBuilder::default(),
		}
	}
}
#[wasm_bindgen]
impl NoteBuilderInput {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	pub fn prefix(&mut self, prefix: JsString) -> () {
		self.note_builder.prefix = prefix.into();
	}

	pub fn version(&mut self, version: Version) -> () {
		let c: String = JsValue::from(&version).as_string().unwrap();
		self.note_builder.version = c.parse().unwrap();
	}

	pub fn chain(&mut self, chain: JsString) -> () {
		self.note_builder.chain = chain.into();
	}

	pub fn backend(&mut self, backend: BE) -> () {
		let c: String = JsValue::from(&backend).as_string().unwrap();
		self.note_builder.backend = c.parse().unwrap();
	}

	pub fn hash_function(&mut self, hash_function: HF) -> () {
		let c: String = JsValue::from(&hash_function).as_string().unwrap();
		self.note_builder.hash_function = c.parse().unwrap();
	}

	pub fn curve(&mut self, curve: Curve) -> () {
		let c: String = JsValue::from(&curve).as_string().unwrap();
		self.note_builder.curve = c.parse().unwrap();
	}

	pub fn token_symbol(&mut self, token_symbol: JsString) -> () {
		self.note_builder.token_symbol = token_symbol.into();
	}

	pub fn amount(&mut self, amount: JsString) -> () {
		self.note_builder.amount = amount.into();
	}

	pub fn denomination(&mut self, denomination: JsString) -> () {
		self.note_builder.denomination = denomination.into();
	}
}

impl From<OpStatusCode> for JsValue {
	fn from(e: OpStatusCode) -> Self {
		JsValue::from(e as u32)
	}
}

impl From<Backend> for JsString {
	fn from(e: Backend) -> Self {
		JsString::from(e.to_string())
	}
}

impl From<NoteCurve> for JsString {
	fn from(e: NoteCurve) -> Self {
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

#[wasm_bindgen]
impl DepositNote {
	#[wasm_bindgen(constructor)]
	pub fn new(builder: NoteBuilderInput) -> Result<DepositNote, JsValue> {
		let note = builder
			.note_builder
			.generate_note()
			.map_err(|_| OpStatusCode::SecretGenFailed)?;
		Ok(DepositNote { note })
	}

	pub fn deserialize(note: JsString) -> Result<DepositNote, JsValue> {
		let n: String = note.into();
		let n = Note::deserialize(&n)?;
		Ok(DepositNote { note: n })
	}

	pub fn serialize(&self) -> JsString {
		JsString::from(self.note.to_string())
	}

	#[wasm_bindgen(getter)]
	pub fn prefix(&self) -> JsString {
		self.note.prefix.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn version(&self) -> JsString {
		self.note.version.into()
	}

	#[wasm_bindgen(getter)]
	pub fn chain(&self) -> JsString {
		self.note.chain.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> JsString {
		self.note.backend.into()
	}

	#[wasm_bindgen(getter)]
	pub fn hash_function(&self) -> JsString {
		self.note.hash_function.into()
	}

	#[wasm_bindgen(getter)]
	pub fn curve(&self) -> JsString {
		self.note.curve.into()
	}

	#[wasm_bindgen(getter)]
	pub fn secret(&self) -> JsString {
		let secret = hex::encode(&self.note.secret);
		secret.into()
	}

	#[wasm_bindgen(getter)]
	pub fn token_symbol(&self) -> JsString {
		self.note.token_symbol.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		self.note.amount.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn denomination(&self) -> JsString {
		self.note.denomination.clone().into()
	}
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct ProvingManager {
	builder: ZkProofBuilder,
}

struct Uint8Arrayx32([u8; 32]);

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

#[wasm_bindgen]
impl ProvingManager {
	#[wasm_bindgen(constructor)]
	pub fn new() -> ProvingManager {
		ProvingManager {
			builder: ZkProofBuilder::default(),
		}
	}

	pub fn set_recipient(&mut self, recipient: JsString) -> Result<(), JsValue> {
		let r: String = recipient.into();
		let r = hex::decode(r).unwrap();
		self.builder.set_recipient(&r);
		Ok(())
	}

	pub fn set_relayer(&mut self, relayer: JsString) -> Result<(), JsValue> {
		let r: String = relayer.into();
		let r = hex::decode(r).unwrap();
		self.builder.set_relayer(&r);
		Ok(())
	}

	pub fn set_note(&mut self, deposit_note: &DepositNote) -> Result<(), JsValue> {
		let note = deposit_note.note.clone();
		self.builder.set_note(note);
		Ok(())
	}

	pub fn set_note_from_str(&mut self, note_str: JsString) -> Result<(), JsValue> {
		let r: String = note_str.into();
		let note = Note::deserialize(&r)?;
		self.builder.set_note(note);
		Ok(())
	}

	pub fn set_leaves(&mut self, leaves: Leaves) -> Result<(), JsValue> {
		let ls: Vec<_> = Array::from(&leaves)
			.to_vec()
			.into_iter()
			.map(|v| Uint8Array::new_with_byte_offset_and_length(&v, 0, 32))
			.map(Uint8Arrayx32::try_from)
			.collect::<Result<Vec<_>, _>>()?
			.into_iter()
			.map(|v| v.0)
			.collect();
		self.builder.set_leaves(&ls);
		Ok(())
	}

	pub fn proof(&self) -> Result<JsString, JsValue> {
		let proof = self.builder.build();
		let mut proof_bytes = Vec::new();
		match proof {
			ZKProof::Bls12_381(proof) => CanonicalSerialize::serialize(&proof, &mut proof_bytes),

			ZKProof::Bn254(proof) => CanonicalSerialize::serialize(&proof, &mut proof_bytes),
		}
		.map_err(|_| OpStatusCode::Unknown)?;
		Ok(JsString::from(hex::encode(proof_bytes)))
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use wasm_bindgen_test::*;

	wasm_bindgen_test_configure!(run_in_browser);

	#[wasm_bindgen_test]
	fn generate_proof() {
		let leaves = [
			"0x2e5c62af48845c095bfa9b90b8ec9f6b7bd98fb3ac2dd3039050a64b919951dd",
			"0x3007c62f678a503e568534487bc5b0bc651f37bbe1f34668b4c8a360f15ba3c3",
			"0x1ec12c8b3db99467523b352191a93e206d9193e9ca4e6162828f89f375876fba",
			"0x235c395fb58781b1e5d2659a2440e3cc4fe2ca274278bc05bcb8860d339e51bb",
			"0x2cc89541c606482ab5736115f3ca3dd5fcbe150dc50042c27b4653b9428a648f",
			"0x2f0c62e073b5ef26c44e1e590c1000b0388a234dc73f9ada563737b631cbe870",
			"0x15c5b95023b2198bad62de0d2b503af4e1febde94896440aba818849981f3145",
			"0x1181497197f03384d142fa00f88cf731185f886e69560e4ec775e531e9fdaead",
			"0x1a6599a0bf4c5dce3dd8419c968727e813e296075f7fba98c32704aa5481103a",
			"0x25f38e7d28648d602b94dd2e3cba2319212035c42a5c5cc528dbea8b34bb2203",
			"0x204da648df5d62c464bd7b4d88cd2eef4fd3866b12b69f7488c71cf61f0c3b47",
			"0x1fea40ab1d91aa5dbe2f9d5d829e53d09efc3e5b64484008f09d44058f24c071",
			"0x134ec9bdeb51bb4adb26a1ac10cbed5f3c381f897f667134657d27cf16cb291f",
			"0x2e95b88f4caa6c93c7ed1c5736a8a202bf4a24a59d8db5fdd028d88d1097bc8f",
			"0x03d5d333b260a382125e88560015f6343b48ec9791aed5af61c95e0b9cff1c77",
			"0x14d520291c9c32e698a1728138d2b1c6cb43ef4841200a4f54c9389301dd62b6",
			"0x2fce45e16df45d46f637456763b5a80f0e36240122dfa5afe74f5dae6f7e7491",
			"0x0edf79f56a49b49a204a696260c6257fddb061867ea9d0f68f915f99e9212b3a",
			"0x1b76df559c5b20d49d3f3c3c25a91d2f6fb457ca947d229f9a6f3e2f9a8ed2d5",
			"0x0f965c23dd5e2aa59a04edd418173273a55ea34c3c03568346b48f4fa84b9372",
			"0x211cc84443fcabbea8f9c5b7395fbc77de19511761413a79bb6713429c319e20",
			"0x1665fe58542013065e8aa459684ed07a2b45a96e20d698099e72b71b0a2dcd39",
			"0x263caed125777c6ead622bab9935677768f573023490e9a5da01efdb0d535ee9",
			"0x061390a981907195af69a139877a7794b0807d7f943dd093c6b23772aea6b5e7",
			"0x13d420c1c07d781c8ad7761a30aa10948f0c1445db5735a17f8b4d213a458f08",
			"0x08c2088aad0ba3b6b194567779a09efd23f039306b2a1fa177bb9495e5645b5f",
			"0x2c5ae8bbe6693a853cf617acb8997459b096f1e23990c59165d2d83ca4d5a70e",
			"0x2686cde4cc3c2718fc98a494691b1090d162d9b6e97d2094e90186e765a0dd3e",
			"0x16bac9eacf126d54956794571e279532db94b38e89fba15ff029357cbb5b252c",
			"0x18ff90d73fce2ccc8ee0133af9d44cf41fd6d5f9236267b2b3ab544ad53812c0",
			"0x1498ad993ec57cc62702bf5d03ec618fa87d408855ffc77efb6245f8f8abd4d3",
		];

		let mut pm = ProvingManager::new();
		pm.set_relayer(JsString::from("929E7eb6997408C196828773db642D76e79bda93"))
			.unwrap();
		pm.set_recipient(JsString::from("929E7eb6997408C196828773db642D76e79bda93"))
			.unwrap();
		let leaves_ua: Array = leaves
			.to_vec()
			.iter()
			.map(|leaf_str| hex::decode(leaf_str.replace("0x", "")).unwrap())
			.map(|v| Uint8Array::from(v.as_slice()))
			.collect();
		pm.set_leaves(Leaves::from(JsValue::from(leaves_ua))).unwrap();
		let proof = pm.proof().unwrap();
		dbg!(proof);
	}
}
