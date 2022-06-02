use core::fmt;

use ark_bn254::Fr as Bn254Fr;
use ark_ff::{BigInteger, PrimeField};
use ark_std::UniformRand;
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{Curve as ArkCurve, VAnchorProver};
use js_sys::{JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::types::{Backend, Curve, OpStatusCode, WasmCurve, BE};
use crate::{VAnchorR1CSProverBn254_30_2_16_2, VAnchorR1CSProverBn254_30_2_2_2};

#[derive(Clone)]
pub enum JsUtxoInner {
	Bn254(Utxo<Bn254Fr>),
}
impl fmt::Debug for JsUtxoInner {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
		write!(f, "JsUtxoInner")
	}
}
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct JsUtxo {
	#[wasm_bindgen(skip)]
	pub inner: JsUtxoInner,
}

impl JsUtxo {
	pub fn amount_raw(&self) -> u128 {
		let amount_bytes = self.get_amount();
		let mut amount_slice = [0u8; 16];
		amount_slice.copy_from_slice(amount_bytes[..16].to_vec().as_slice());
		u128::from_le_bytes(amount_slice)
	}

	pub fn default_bn254_utxo() -> Self {
		let utxo =
			VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(ArkCurve::Bn254, 0, 0, None, &mut OsRng).unwrap();
		Self {
			inner: JsUtxoInner::Bn254(utxo),
		}
	}

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

	pub fn get_bn254_utxo(&self) -> Result<Utxo<Bn254Fr>, OpStatusCode> {
		match self.inner.clone() {
			JsUtxoInner::Bn254(utxo) => Ok(utxo),
		}
	}
}
#[wasm_bindgen]
impl JsUtxo {
	#[wasm_bindgen(constructor)]
	#[allow(clippy::too_many_arguments)]
	pub fn new(
		curve: WasmCurve,
		backend: BE,
		input_size: u8,
		anchor_size: u8,
		amount: JsString,
		chain_id: JsString,
		index: Option<JsString>,
		private_key: Option<Uint8Array>,
		blinding: Option<Uint8Array>,
	) -> Result<JsUtxo, JsValue> {
		let curve: Curve = JsValue::from(curve)
			.as_string()
			.unwrap()
			.parse()
			.map_err(|_| OpStatusCode::InvalidCurve)?;
		let backend: Backend = JsValue::from(backend)
			.as_string()
			.unwrap()
			.parse()
			.map_err(|_| OpStatusCode::InvalidBackend)?;
		let chain_id: String = chain_id.into();
		let chain_id = chain_id.parse().map_err(|_| OpStatusCode::InvalidChainId)?;
		let amount: String = amount.into();
		let amount: u128 = amount.parse().map_err(|_| OpStatusCode::InvalidAmount)?;
		let index = match index {
			None => None,
			Some(index) => {
				let index: String = index.into();
				let index: u64 = index.parse().map_err(|_| OpStatusCode::InvalidUTXOIndex)?;
				Some(index)
			}
		};
		let mut rng = OsRng;
		let utxo = match (curve, backend) {
			(Curve::Bn254, Backend::Arkworks) => {
				let pk = private_key
					.map(|p| p.to_vec())
					.unwrap_or_else(|| Bn254Fr::rand(&mut rng).into_repr().to_bytes_le());
				let blinding = blinding
					.map(|b| b.to_vec())
					.unwrap_or_else(|| Bn254Fr::rand(&mut rng).into_repr().to_bytes_le());
				match (input_size, anchor_size) {
					(2, 2) => VAnchorR1CSProverBn254_30_2_2_2::create_leaf_with_privates(
						ArkCurve::Bn254,
						chain_id,
						amount,
						index,
						pk,
						blinding,
					),
					(16, 2) => VAnchorR1CSProverBn254_30_2_16_2::create_leaf_with_privates(
						ArkCurve::Bn254,
						chain_id,
						amount,
						index,
						pk,
						blinding,
					),
					_ => return Err(OpStatusCode::InvalidNoteProtocol.into()),
				}
			}
			.map_err(|_| OpStatusCode::InvalidOutputUtxoConfig)
			.map(JsUtxo::new_from_bn254_utxo),
			_ => Err(OpStatusCode::InvalidNoteProtocol),
		}?;

		Ok(utxo)
	}

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
