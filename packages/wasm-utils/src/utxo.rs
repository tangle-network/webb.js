use ark_bn254::Fr as Bn254Fr;
use ark_ff::{BigInteger, PrimeField};
use arkworks_setups::utxo::Utxo;
use js_sys::{JsString, Uint8Array};
use wasm_bindgen::prelude::*;

#[derive(Clone)]
pub enum JsUtxoInner {
	Bn254(Utxo<Bn254Fr>),
}

#[wasm_bindgen]
pub struct JsUtxo {
	inner: JsUtxoInner,
}

impl JsUtxo {
	/// Create `JsUtxo` from a Utxo with bn254 Fr
	pub fn new_from_bn254_utxo(utxo: Utxo<Bn254Fr>) -> Self {
		Self {
			inner: JsUtxoInner::Bn254(utxo),
		}
	}

	/// Getters for inner enum
	pub fn get_chain_id_raw(&self) -> u64 {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.chain_id_raw,
		}
	}

	pub fn get_chain_id_bytes(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.chain_id.into_repr().to_bytes_le(),
		}
	}

	pub fn get_amount(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.amount.into_repr().to_bytes_le(),
		}
	}

	pub fn get_blinding(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.blinding.into_repr().to_bytes_le(),
		}
	}

	pub fn get_secret_key(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.keypair.secret_key.into_repr().to_bytes_le(),
		}
	}

	pub fn get_index(&self) -> Option<u64> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.index,
		}
	}

	pub fn get_index_bytes(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => match bn254_utxo.index {
				None => 0u64.to_le_bytes().to_vec(),
				Some(index) => index.to_le_bytes().to_vec(),
			},
		}
	}

	pub fn get_nullifier(&self) -> Option<Vec<u8>> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => &bn254_utxo.nullifier,
		}
		.map(|value| value.into_repr().to_bytes_le())
	}

	pub fn get_commitment(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.commitment.into_repr().to_bytes_le(),
		}
	}

	pub fn get_bn254_utxo(&self) -> Result<Utxo<Bn254Fr>, JsValue> {
		match self.inner.clone() {
			JsUtxoInner::Bn254(utxo) => Ok(utxo),
		}
	}
}

#[wasm_bindgen]
impl JsUtxo {
	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = chainIdRaw)]
	pub fn chain_id_raw(&self) -> u64 {
		self.get_chain_id_raw()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = chainIdBytes)]
	pub fn chain_id_bytes(&self) -> JsString {
		let chain_id_bytes = self.get_chain_id_bytes();
		hex::encode(chain_id_bytes).into()
	}

	#[wasm_bindgen(getter)]
	pub fn amount(&self) -> JsString {
		let amount = self.get_amount();
		hex::encode(amount).into()
	}

	#[wasm_bindgen(getter)]
	pub fn blinding(&self) -> JsString {
		let blinding = self.get_blinding();
		hex::encode(blinding).into()
	}

	#[wasm_bindgen(getter)]
	pub fn secret_key(&self) -> JsString {
		let secret_key = self.get_secret_key();
		hex::encode(secret_key).into()
	}

	#[wasm_bindgen(getter)]
	pub fn index(&self) -> JsValue {
		let index = self.get_index().unwrap_or(0);
		JsValue::from(index)
	}

	#[wasm_bindgen(getter)]
	pub fn nullifier(&self) -> JsString {
		let nullifier = self
			.get_nullifier()
			.map(|value| hex::encode(value.as_slice()))
			.unwrap_or_else(|| "".to_string());

		JsString::from(nullifier)
	}

	#[wasm_bindgen(getter)]
	pub fn commitment(&self) -> Uint8Array {
		let commitment = self.get_commitment();

		Uint8Array::from(commitment.as_slice())
	}
}
