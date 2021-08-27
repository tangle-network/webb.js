use ark_serialize::CanonicalSerializeHashExt;
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use rand::{Rng, SeedableRng};
use wasm_bindgen::__rt::std::alloc::Global;
use wasm_bindgen::prelude::*;

use crate::note::note::CircomPolyfill;
use crate::proof::{CricomZKPPolyFill, ZKPInput};
use crate::types::OpStatusCode;
use crate::wasm::{Leaves, Uint8Arrayx32};
use std::convert::TryFrom;

#[wasm_bindgen(module = "/circom-pf/webb-circomlib.js")]
extern "C" {

	#[wasm_bindgen(js_namespace = ["WebbTornadocircomlib"])]
	pub fn pedersenHash(data: Uint8Array) -> JsString;

	#[wasm_bindgen(js_namespace = ["WebbTornadocircomlib"])]
	pub fn generateZKp(
		recipient: JsString,
		relayer: JsString,
		leaves: Leaves,
		leaf_index: JsString,
		fee: JsString,
		refund: JsString,
	) -> Uint8Array;

}

const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
pub struct CircomPF;

impl CircomPF {
	pub fn new() -> Self {
		Self
	}
}

impl CricomZKPPolyFill for CircomPF {
	fn generate_zkp(&self, input: ZKPInput) -> Vec<u8> {
		let relayer: JsString = hex::encode(input.relayer).unwrap().into();
		let recipient: JsString = hex::encode(input.recipient).unwrap().into();
		let leaf_index: JsString = input.leaf_index.to_string().into();
		let fee: JsString = input.fee.to_string().into();
		let refund: JsString = input.refund.to_string().into();
		let leaves: Array = input.leaves.iter().map(|v| Uint8Array::from(v)).collect();
		let leaves: Leaves = Leaves::from(JsValue::from(leaves));
		let proof = generateZKp(recipient, relayer, leaves, leaf_index, fee, refund);
		let unit = Uint8Arrayx32::try_from(proof).unwrap();
		unit.0.to_vec()
	}
}

impl CircomPolyfill for CircomPF {
	fn hash(&self, secrets: &[u8]) -> Result<Vec<u8>, OpStatusCode> {
		let u8a = Uint8Array::from(secrets);
		let value = pedersenHash(u8a);
		let string: String = value.into();
		Ok(hex::decode(string).unwrap())
	}

	fn generate_secrets(&self) -> Result<Vec<u8>, OpStatusCode> {
		let mut bytes = [0u8; 62];
		let mut rng = OsRng::default();
		rng.fill(&mut bytes[..]);
		Ok(bytes.to_vec())
	}
}

#[cfg(test)]
mod tests {
	use wasm_bindgen_test::*;

	use crate::types::Backend::Circom;

	use super::*;

	wasm_bindgen_test_configure!(run_in_browser);
	#[wasm_bindgen_test]
	fn hash() {
		let bytes = hex::decode("1498ad993ec57cc62702bf5d03ec618fa87d408855ffc77efb6245f8f8abd4").unwrap();
		let u8a = Uint8Array::from(bytes.as_slice());
		let value = pedersenHash(u8a);
		let string: String = value.into();
		web_sys::console::log_1(&string.into());
	}
}
