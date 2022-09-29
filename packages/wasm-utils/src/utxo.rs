use core::fmt;
use core::fmt::Formatter;
use core::str::FromStr;

use ark_bn254::Fr as Bn254Fr;
use ark_ff::{BigInteger, PrimeField};
use ark_std::UniformRand;
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{Curve as ArkCurve, VAnchorProver};
use js_sys::{JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

use crate::types::{Backend, Curve, OpStatusCode, OperationError, WasmCurve, BE};
use crate::VAnchorR1CSProverBn254_30_2_2_2;

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
	pub(crate) fn new(
		curve: Curve,
		backend: Backend,
		amount: u128,
		chain_id: u64,
		blinding: Option<Vec<u8>>,
		public_key: Option<Vec<u8>>,
		private_key: Option<Vec<u8>>,
		index: Option<u64>,
	) -> Result<JsUtxo, OperationError> {
		let mut rng = OsRng;
		let utxo = match (curve, backend) {
			(Curve::Bn254, Backend::Arkworks) => {
				// If blinding wasn't passed, create it
				let blinding = blinding.unwrap_or(Bn254Fr::rand(&mut rng).into_repr().to_bytes_be());

				match private_key {
					// If a private key was passed, generate the public key from the private key.
					Some(priv_key) => {
						VAnchorR1CSProverBn254_30_2_2_2::create_utxo(
							ArkCurve::Bn254,
							chain_id,
							amount,
							index,
							priv_key,
							blinding,
						)
					}
					None => {
						match public_key {
							// If a public key has been configured without a private key, create a "public" utxo.
							// This public utxo is useful for transferring ownership to the private key owner
							// of a configured public key.
							Some(pub_key) => {
								VAnchorR1CSProverBn254_30_2_2_2::create_public_utxo(
									ArkCurve::Bn254,
									chain_id,
									amount,
									blinding,
									pub_key,
									index
								)
							},
							// If neither key has been configured, simply create a utxo with a random private key.
							None => VAnchorR1CSProverBn254_30_2_2_2::create_random_utxo(
								ArkCurve::Bn254,
								chain_id,
								amount,
								index,
								&mut rng
							)
						}
					}
				}
			}
			.map_err(|_| OpStatusCode::InvalidOutputUtxoConfig)
			.map(JsUtxo::new_from_bn254_utxo),
			_ => Err(OpStatusCode::InvalidNoteProtocol),
		}?;

		Ok(utxo)
	}

	pub fn get_amount_raw(&self) -> u128 {
		let amount_bytes = self.get_amount();
		let mut amount_slice = [0u8; 16];
		amount_slice.copy_from_slice(amount_bytes[16..32].to_vec().as_slice());
		u128::from_be_bytes(amount_slice)
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
		self.chain_id_raw().to_be_bytes().to_vec()
	}

	pub fn get_amount(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.amount.into_repr().to_bytes_be(),
		}
	}

	pub fn get_blinding(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.blinding.into_repr().to_bytes_be(),
		}
	}

	pub fn get_public_key(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.keypair.public_key.into_repr().to_bytes_be(),
		}
	}

	pub fn get_secret_key(&self) -> Option<Vec<u8>> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => {
				match bn254_utxo.keypair.secret_key {
					Some(key) => Some(key.into_repr().to_bytes_be()),
					None => None
				}
			}
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
				None => 0u64.to_be_bytes().to_vec(),
				Some(index) => index.to_be_bytes().to_vec(),
			},
		}
	}

	pub fn get_nullifier(&self) -> Option<Vec<u8>> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => &bn254_utxo.nullifier,
		}
		.map(|value| value.into_repr().to_bytes_be())
	}

	pub fn get_commitment(&self) -> Vec<u8> {
		match &self.inner {
			JsUtxoInner::Bn254(bn254_utxo) => bn254_utxo.commitment.into_repr().to_bytes_be(),
		}
	}

	pub fn get_bn254_utxo(&self) -> Result<Utxo<Bn254Fr>, OpStatusCode> {
		match self.inner.clone() {
			JsUtxoInner::Bn254(utxo) => Ok(utxo),
		}
	}

	pub fn deserialize(utxo_str: &str) -> Result<JsUtxo, OperationError> {
		utxo_str.parse().map_err(Into::into)
	}
}

#[wasm_bindgen]
impl JsUtxo {
	pub fn serialize(&self) -> JsString {
		JsString::from(self.to_string())
	}

	#[wasm_bindgen(js_name = deserialize)]
	pub fn js_deserialize(utxo_str: JsString) -> Result<JsUtxo, JsValue> {
		let utxo_str: String = utxo_str.into();
		Self::deserialize(&utxo_str).map_err(Into::into)
	}

	#[wasm_bindgen(constructor)]
	#[allow(clippy::too_many_arguments)]
	pub fn construct(
		curve: WasmCurve,
		backend: BE,
		amount: JsString,
		chain_id: JsString,
		blinding: Option<Uint8Array>,
		public_key: Option<Uint8Array>,
		private_key: Option<Uint8Array>,
		index: Option<JsString>,
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
				if index.len() == 0 {
					None
				} else {
					let index: u64 = index.parse().map_err(|_| OpStatusCode::InvalidUTXOIndex)?;
					Some(index)
				}
			}
		};
		let utxo = match (curve, backend) {
			(Curve::Bn254, Backend::Arkworks) => {
				let blinding_vec: Option<Vec<u8>> = match blinding {
					Some(val) => Some(val.to_vec()),
					None => None
				};
				let public_key_vec: Option<Vec<u8>> = match public_key {
					Some(val) => Some(val.to_vec()),
					None => None
				};
				let private_key_vec: Option<Vec<u8>> = match private_key {
					Some(val) => Some(val.to_vec()),
					None => None
				};

				JsUtxo::new(
					Curve::Bn254,
					Backend::Arkworks,
					amount,
					chain_id,
					blinding_vec,
					public_key_vec,
					private_key_vec,
					index,
				)
			}
			.map_err(|_| OpStatusCode::InvalidOutputUtxoConfig),
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
	#[wasm_bindgen(js_name = chainId)]
	pub fn chain_id(&self) -> JsString {
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
	pub fn public_key(&self) -> JsString {
		let public_key = self.get_public_key();
		hex::encode(public_key).into()
	}

	#[wasm_bindgen(getter)]
	pub fn secret_key(&self) -> JsString {
		let secret_key = self.get_secret_key().unwrap_or(vec![]);
		hex::encode(secret_key).into()
	}

	#[wasm_bindgen(getter)]
	pub fn index(&self) -> JsValue {
		let index = self.get_index().unwrap_or(0);
		JsValue::from(index)
	}

	#[wasm_bindgen(setter)]
	pub fn set_index(&self, val: u64) {
		match self.inner.clone() {
			JsUtxoInner::Bn254(mut utxo) => {
				utxo.set_index(val.clone());
			},
		}
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

impl fmt::Display for JsUtxo {
	fn fmt(&self, f: &mut Formatter<'_>) -> core::fmt::Result {
		let curve = match self.inner {
			JsUtxoInner::Bn254(_) => Curve::Bn254.to_string(),
		};
		let backend = Backend::Arkworks.to_string();
		let amount = self.get_amount_raw().to_string();
		let chain_id = self.get_chain_id_raw().to_string();
		let index = self
			.get_index()
			.map(|v| v.to_string())
			.unwrap_or_else(|| "".to_string());
		let blinding = hex::encode(self.get_blinding());
		let public_key = hex::encode(self.get_public_key());
		let private_key = hex::encode(self.get_secret_key().unwrap_or(vec![]));

		let sec = vec![curve, backend, amount, chain_id, blinding, public_key, private_key, index].join("&");

		write!(f, "{}", sec)
	}
}

impl FromStr for JsUtxo {
	type Err = OperationError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		let parts: Vec<_> = s.split('&').collect();
		let curve: Curve = parts[0].parse().map_err(|_| OpStatusCode::InvalidCurve)?;
		let backend: Backend = parts[1].parse().map_err(|_| OpStatusCode::InvalidBackend)?;
		let amount = parts[2].parse().map_err(|_| OpStatusCode::InvalidAmount)?;
		let chain_id = parts[3].parse().map_err(|_| OpStatusCode::InvalidChainId)?;
		let public_key = hex::decode(parts[5]).map_err(|_| OpStatusCode::Unknown)?;
		let index = match parts[7] {
			"" => None,
			v => {
				let index: u64 = v.parse().map_err(|_| OpStatusCode::InvalidUTXOIndex)?;
				Some(index)
			}
		};
		let blinding = hex::decode(parts[4]).map_err(|_| OpStatusCode::Unknown)?;
		let private_key = hex::decode(parts[6]).map_err(|_| OpStatusCode::Unknown)?;

		if private_key.len() == 32 {
			JsUtxo::new(
				curve,
				backend,
				amount,
				chain_id,
				Some(blinding),
				Some(public_key),
				Some(private_key),
				index,
			)
		} else {
			JsUtxo::new(
				curve,
				backend,
				amount,
				chain_id,
				Some(blinding),
				Some(public_key),
				None,
				index
			)
		}
	}
}
