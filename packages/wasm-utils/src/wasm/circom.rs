use ark_serialize::CanonicalSerializeHashExt;
use wasm_bindgen::prelude::*;

use crate::note::note::CircomPolyfill;
use crate::types::OpStatusCode;

#[wasm_bindgen(module = "/circom-pf/circom.js")]
extern "C" {
	pub type CircomPF;

	#[wasm_bindgen(constructor)]
	pub fn new() -> CircomPF;

	#[wasm_bindgen(method)]
	pub fn hash(this: &CircomPF) -> String;

	#[wasm_bindgen(method)]
	pub fn generate(this: &CircomPF) -> String;

}
impl CircomPolyfill for CircomPF {
	fn hash(&self, secrets: &[u8]) -> Result<Vec<u8>, OpStatusCode> {
		Ok(hex::decode(self.hash()).unwrap())
	}

	fn generate_secrets(&self) -> Result<Vec<u8>, OpStatusCode> {
		Ok(hex::decode(self.generate()).unwrap())
	}
}
