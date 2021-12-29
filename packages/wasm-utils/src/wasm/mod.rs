use std::convert::{TryFrom, TryInto};
use std::ops::Deref;

use ark_serialize::CanonicalSerialize;
use console_error_panic_hook;
use js_sys::{Array, JsString, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::note::secrets::generate_secrets;
use crate::note::Note;
use crate::proof::{ZKProof, ZkProofBuilder};
use crate::types::{Backend, Curve as NoteCurve, HashFunction, NotePrefix, NoteVersion, OpStatusCode};
use rand::rngs::OsRng;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type = "NotePrefix")]
	pub type Prefix;

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
const NOTE_PREFIX: &str = "type NotePrefix = 'webb.mixer'|'webb.bridge' ";

#[wasm_bindgen(typescript_custom_section)]
const LEAVES: &str = "type Leaves = Array<Uint8Array>;";

#[wasm_bindgen(typescript_custom_section)]
const HF: &str = "type HashFunction = 'Poseidon'|'MiMCTornado'";

#[wasm_bindgen(typescript_custom_section)]
const CURVE: &str = "type Curve = 'Bls381'|'Bn254' |'Curve25519'";

#[wasm_bindgen(typescript_custom_section)]
const VERSION: &str = "type Version = 'v1'";

#[wasm_bindgen(typescript_custom_section)]
const BE: &str = "type Backend = 'Bulletproofs'|'Arkworks'|'Circom'";

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct JsNote {
	note: Note,
}

#[wasm_bindgen]
pub struct JsNoteBuilder {
	#[wasm_bindgen(skip)]
	pub prefix: Option<NotePrefix>,
	#[wasm_bindgen(skip)]
	pub version: Option<NoteVersion>,
	#[wasm_bindgen(skip)]
	pub target_chain_id: Option<String>,
	#[wasm_bindgen(skip)]
	pub source_chain_id: Option<String>,
	/// zkp related items
	#[wasm_bindgen(skip)]
	pub backend: Option<Backend>,
	#[wasm_bindgen(skip)]
	pub hash_function: Option<HashFunction>,
	#[wasm_bindgen(skip)]
	pub curve: Option<NoteCurve>,
	#[wasm_bindgen(skip)]
	pub token_symbol: Option<String>,
	#[wasm_bindgen(skip)]
	pub amount: Option<String>,
	#[wasm_bindgen(skip)]
	pub denomination: Option<u8>,
	#[wasm_bindgen(skip)]
	pub exponentiation: Option<i8>,
	#[wasm_bindgen(skip)]
	pub width: Option<usize>,
	#[wasm_bindgen(skip)]
	pub secrets: Option<Vec<u8>>,
}

impl Default for JsNoteBuilder {
	fn default() -> Self {
		Self {
			prefix: None,
			version: None,
			target_chain_id: None,
			source_chain_id: None,
			backend: None,
			hash_function: None,
			curve: None,
			token_symbol: None,
			amount: None,
			denomination: None,
			exponentiation: None,
			width: None,
			secrets: None,
		}
	}
}
#[wasm_bindgen]
impl JsNoteBuilder {
	#[wasm_bindgen(constructor)]
	pub fn new() -> Self {
		Self::default()
	}

	pub fn prefix(&mut self, prefix: Prefix) {
		let prefix: String = JsValue::from(&prefix).as_string().unwrap();
		let note_prefix: NotePrefix = prefix.as_str().parse().unwrap();
		self.prefix = Some(note_prefix);
	}

	pub fn version(&mut self, version: Version) {
		let version: String = JsValue::from(&version).as_string().unwrap();
		let note_version: NoteVersion = version.as_str().parse().unwrap();
		self.version = Some(note_version);
	}

	#[wasm_bindgen(js_name = targetChainId)]
	pub fn chain_id(&mut self, target_chain_id: JsString) {
		self.target_chain_id = Some(target_chain_id.into());
	}

	#[wasm_bindgen(js_name = sourceChainId)]
	pub fn source_chain_id(&mut self, source_chain_id: JsString) {
		self.source_chain_id = Some(source_chain_id.into());
	}

	pub fn backend(&mut self, backend: BE) {
		let c: String = JsValue::from(&backend).as_string().unwrap();
		let backend: Backend = c.parse().unwrap();
		self.backend = Some(backend);
	}

	#[wasm_bindgen(js_name = hashFunction)]
	pub fn hash_function(&mut self, hash_function: HF) {
		let hash_function: String = JsValue::from(&hash_function).as_string().unwrap();
		let hash_function: HashFunction = hash_function.parse().unwrap();
		self.hash_function = Some(hash_function);
	}

	pub fn curve(&mut self, curve: Curve) {
		let curve: String = JsValue::from(&curve).as_string().unwrap();
		let curve: NoteCurve = curve.parse().unwrap();
		self.curve = Some(curve);
	}

	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&mut self, token_symbol: JsString) {
		self.token_symbol = Some(token_symbol.into());
	}

	pub fn amount(&mut self, amount: JsString) {
		self.amount = Some(amount.into());
	}

	pub fn denomination(&mut self, denomination: JsString) {
		let den: String = denomination.into();
		let denomination = den.parse().unwrap();
		self.denomination = Some(denomination);
	}

	pub fn exponentiation(&mut self, exponentiation: JsString) {
		let exp: String = exponentiation.into();
		let exponentiation = exp.parse().unwrap();
		self.exponentiation = Some(exponentiation);
	}

	pub fn width(&mut self, width: JsString) {
		let width: String = width.into();
		let width = width.parse().unwrap();
		self.width = Some(width);
	}

	#[wasm_bindgen(js_name = setSecrets)]
	pub fn set_secrets(&mut self, secrets: JsString) {
		let secrets_string: String = secrets.into();
		let sec = hex::decode(secrets_string.replace("0x", "")).unwrap();
		self.secrets = Some(sec);
	}

	pub fn build(self) -> Result<JsNote, JsValue> {
		// todo validate
		let exponentiation = self.exponentiation.unwrap();
		let curve = self.curve.unwrap();
		let width = self.width.unwrap();

		let secret = match self.secrets {
			None => generate_secrets(exponentiation, width, curve, &mut OsRng)?,
			Some(secrets) => secrets.clone(),
		};
		let note: Note = Note {
			prefix: self.prefix.unwrap(),
			version: self.version.unwrap(),
			target_chain_id: self.target_chain_id.unwrap(),
			source_chain_id: self.source_chain_id.unwrap(),
			backend: self.backend.unwrap(),
			hash_function: self.hash_function.unwrap(),
			curve: self.curve.unwrap(),
			token_symbol: self.token_symbol.unwrap(),
			amount: self.amount.unwrap(),
			denomination: self.denomination.unwrap(),
			exponentiation: self.exponentiation.unwrap(),
			width: self.width.unwrap(),
			secret,
		};
		Ok(JsNote { note })
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
impl From<NotePrefix> for JsString {
	fn from(e: NotePrefix) -> Self {
		JsString::from(e.to_string())
	}
}

#[wasm_bindgen]
impl JsNote {
	#[wasm_bindgen(constructor)]
	pub fn new(builder: JsNoteBuilder) -> Result<JsNote, JsValue> {
		builder.build()
	}

	pub fn deserialize(note: JsString) -> Result<JsNote, JsValue> {
		let n: String = note.into();
		let n = Note::deserialize(&n)?;
		Ok(JsNote { note: n })
	}

	#[wasm_bindgen(js_name = getLeafCommitment)]
	pub fn get_leaf_commitment(&self) -> Result<Uint8Array, JsValue> {
		let (leaf, ..) = self.note.get_leaf_and_nullifier()?;
		Ok(Uint8Array::from(leaf.as_slice()))
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

	#[wasm_bindgen(js_name = targetChainId)]
	#[wasm_bindgen(getter)]
	pub fn target_chain_id(&self) -> JsString {
		self.note.target_chain_id.clone().into()
	}

	#[wasm_bindgen(js_name = sourceChainId)]
	#[wasm_bindgen(getter)]
	pub fn source_chain_id(&self) -> JsString {
		self.note.source_chain_id.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn backend(&self) -> JsString {
		self.note.backend.into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = hashFunction)]
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
	#[wasm_bindgen(js_name = tokenSymbol)]
	pub fn token_symbol(&self) -> JsString {
		self.note.token_symbol.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		self.note.amount.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn denomination(&self) -> JsString {
		let denomination = self.note.denomination.to_string();
		denomination.into()
	}

	#[wasm_bindgen(getter)]
	pub fn width(&self) -> JsString {
		let width = self.note.width.to_string();
		width.into()
	}

	#[wasm_bindgen(getter)]
	pub fn exponentiation(&self) -> JsString {
		let exp = self.note.exponentiation.to_string();
		exp.into()
	}
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct ProvingManager {
	builder: ZkProofBuilder,
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq)]
pub struct Proof {
	#[wasm_bindgen(skip)]
	pub proof: String,
	#[wasm_bindgen(skip)]
	pub nullifier_hash: String,
	#[wasm_bindgen(skip)]
	pub root: String,
}

#[wasm_bindgen]
impl Proof {
	#[wasm_bindgen(getter)]
	pub fn proof(&self) -> JsString {
		self.proof.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn nullifier_hash(&self) -> JsString {
		self.nullifier_hash.clone().into()
	}

	#[wasm_bindgen(getter)]
	pub fn root(&self) -> JsString {
		self.root.clone().into()
	}
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

impl Default for ProvingManager {
	fn default() -> Self {
		Self {
			builder: ZkProofBuilder::default(),
		}
	}
}
#[wasm_bindgen]
impl ProvingManager {
	#[wasm_bindgen(constructor)]
	pub fn new() -> ProvingManager {
		ProvingManager::default()
	}

	#[wasm_bindgen(js_name = setRecipient)]
	pub fn set_recipient(&mut self, recipient: JsString) -> Result<(), JsValue> {
		let r: String = recipient.into();
		let r = hex::decode(r).unwrap();
		self.builder.set_recipient(&r);
		Ok(())
	}

	#[wasm_bindgen(js_name = setRelayer)]
	pub fn set_relayer(&mut self, relayer: JsString) -> Result<(), JsValue> {
		let r: String = relayer.into();
		let r = hex::decode(r).unwrap();
		self.builder.set_relayer(&r);
		Ok(())
	}

	#[wasm_bindgen(js_name = setNote)]
	pub fn set_note(&mut self, deposit_note: &JsNote) -> Result<(), JsValue> {
		let note = deposit_note.note.clone();
		self.builder.set_note(note);
		Ok(())
	}

	#[wasm_bindgen(js_name = setNoteStr)]
	pub fn set_note_from_str(&mut self, note_str: JsString) -> Result<(), JsValue> {
		let r: String = note_str.into();
		let note = Note::deserialize(&r)?;
		self.builder.set_note(note);
		Ok(())
	}

	#[wasm_bindgen(js_name = setLeafIndex)]
	pub fn set_leaf_index(&mut self, index: u32) -> Result<(), JsValue> {
		self.builder.set_leaf_index(index);
		Ok(())
	}

	#[wasm_bindgen(js_name = setFee)]
	pub fn set_fee(&mut self, fee: u32) -> Result<(), JsValue> {
		self.builder.set_fee(fee);
		Ok(())
	}

	#[wasm_bindgen(js_name = setRefund)]
	pub fn set_refund(&mut self, refund: u32) -> Result<(), JsValue> {
		self.builder.set_refund(refund);
		Ok(())
	}

	#[wasm_bindgen(js_name = setProvingKey)]
	pub fn set_proving_key(&mut self, pk: Uint8Array) -> Result<(), JsValue> {
		let pk: Vec<u8> = pk.to_vec();
		web_sys::console::log_1(&"Importing the PK".into());
		self.builder.set_proving_key(&pk);
		web_sys::console::log_1(&"Imported the PK".into());
		Ok(())
	}

	#[wasm_bindgen(js_name = setLeaves)]
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

	pub fn proof(&self) -> Result<Proof, JsValue> {
		let proof = self.builder.build();
		let mut proof_bytes = Vec::new();
		let meta = match proof {
			ZKProof::Bls12_381(proof, meta) => {
				CanonicalSerialize::serialize(&proof, &mut proof_bytes).map_err(|_| OpStatusCode::Unknown)?;
				meta
			}
			ZKProof::Bn254(proof, meta) => {
				CanonicalSerialize::serialize(&proof, &mut proof_bytes).map_err(|_| OpStatusCode::Unknown)?;
				meta
			}
		};
		let proof = Proof {
			proof: hex::encode(proof_bytes),
			root: hex::encode(meta.root),
			nullifier_hash: hex::encode(meta.nullified_hash),
		};
		Ok(proof)
	}
}

#[cfg(test)]
mod tests {
	use wasm_bindgen_test::*;

	use super::*;

	wasm_bindgen_test_configure!(run_in_browser);

	#[wasm_bindgen_test]
	fn deserialize_to_js_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";
		let note = JsNote::deserialize(JsString::from(note_str)).unwrap();

		assert_eq!(note.prefix(), JsString::from(NotePrefix::Bridge.to_string()));
		assert_eq!(note.version(), JsString::from(NoteVersion::V1.to_string()));
		assert_eq!(note.target_chain_id(), JsString::from("3"));
		assert_eq!(note.source_chain_id(), JsString::from("2"));

		assert_eq!(note.width(), JsString::from("5"));
		assert_eq!(note.exponentiation(), JsString::from("5"));
		assert_eq!(note.denomination(), JsString::from("18"));
		assert_eq!(note.token_symbol(), JsString::from("EDG"));

		assert_eq!(note.backend(), JsString::from(Backend::Arkworks.to_string()));
		assert_eq!(note.curve(), JsString::from(NoteCurve::Bn254.to_string()));
		assert_eq!(note.hash_function(), JsString::from(HashFunction::Poseidon.to_string()));
	}
	#[wasm_bindgen_test]
	fn serialize_js_note() {
		let note_str = "webb.bridge:v1:3:2:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";

		let mut note_builder = JsNoteBuilder::new();
		let prefix: Prefix = JsValue::from(NotePrefix::Bridge.to_string()).into();
		let version: Version = JsValue::from(NoteVersion::V1.to_string()).into();
		let backend: BE = JsValue::from(Backend::Arkworks.to_string()).into();
		let hash_function: HF = JsValue::from(HashFunction::Poseidon.to_string()).into();

		note_builder.prefix(prefix);
		note_builder.version(version);
		note_builder.chain_id(JsString::from("3"));
		note_builder.source_chain_id(JsString::from("2"));

		note_builder.width(JsString::from("5"));
		note_builder.exponentiation(JsString::from("5"));
		note_builder.denomination(JsString::from("18"));

		note_builder.token_symbol(JsString::from("EDG"));
		note_builder.hash_function(hash_function);
		note_builder.backend(backend);
		note_builder.set_secrets(JsString::from("7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717"));
		let note = note_builder.build().unwrap();
		assert_eq!(note.serialize(), JsString::from(note_str));
	}

	#[wasm_bindgen_test]
	fn generate_leaf() {
		let note = JsNote::deserialize(JsString::from("webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:WEBB:18:10:5:5:a1feeba98193583d3fb0304b456676976ff379ef54f3749419741d9b6eec2b20e059e20847ba94f6b78fcacb2e6b8b6dd1f40e65c6b0d15eb3b40a4fc600431797c787b40e6ead35527a299786411a19731ba909c3ab2e242b4abefb023f072a")).unwrap();
	}

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
		pm.set_relayer(JsString::from(
			"644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129",
		))
		.unwrap();
		pm.set_recipient(JsString::from(
			"644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129",
		))
		.unwrap();
		let leaves_ua: Array = leaves
			.to_vec()
			.iter()
			.map(|leaf_str| hex::decode(leaf_str.replace("0x", "")).unwrap())
			.map(|v| Uint8Array::from(v.as_slice()))
			.collect();
		pm.set_leaves(Leaves::from(JsValue::from(leaves_ua))).unwrap();
		pm.set_note_from_str(JsString::from("webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:EDG:18:1:5:5:933bd84d0b7ed9fa9b216797f787d16898c0d489c7461dc3ff8fdcd34453362bb6a1379362205f3bf2a05ae2bfa7023ad01997db8acc404ecc81293f5de02022bcf08f6d2576af2577cd61b2d2aa0d94c2814084d4c3913a4ee4beb76ba9171c"));
		let proof = pm.proof().unwrap();

		dbg!(proof);
	}
}

#[wasm_bindgen(start)]
pub fn main() {
	console_error_panic_hook::set_once();
}
