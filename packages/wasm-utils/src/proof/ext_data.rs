use ark_bn254::Fr as Bn254Fr;
use ark_ff::{BigInteger, PrimeField};
use ethabi::{encode, Token};
use js_sys::{JsString, Uint8Array};
use parity_scale_codec::{Decode, Encode};
use tiny_keccak::{Hasher, Keccak};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[derive(Encode, Decode, Default)]
#[wasm_bindgen]
pub struct ExtData {
	#[wasm_bindgen(skip)]
	pub recipient: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub relayer: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub ext_amount: i128,
	#[wasm_bindgen(skip)]
	pub fee: u128,
	#[wasm_bindgen(skip)]
	pub refund: u128,
	#[wasm_bindgen(skip)]
	pub unwrapped_token: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub encrypted_output1: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub encrypted_output2: Vec<u8>,
}
#[wasm_bindgen]
impl ExtData {
	#[wasm_bindgen(constructor)]
	pub fn new(
		recipient: Uint8Array,
		relayer: Uint8Array,
		ext_amount: JsString,
		fee: JsString,
		refund: JsString,
		unwrapped_token: Uint8Array,
		encrypted_output1: Uint8Array,
		encrypted_output2: Uint8Array,
	) -> ExtData {
		let fee: u128 = JsValue::from(fee).as_string().unwrap().parse().unwrap();
		let ext_amount: i128 = JsValue::from(ext_amount).as_string().unwrap().parse().unwrap();
		let recipient = recipient.to_vec();
		let relayer = relayer.to_vec();
		let refund: u128 = JsValue::from(refund).as_string().unwrap().parse().unwrap();
		let unwrapped_token = unwrapped_token.to_vec();
		let encrypted_output1 = encrypted_output1.to_vec();
		let encrypted_output2 = encrypted_output2.to_vec();
		ExtData {
			fee,
			ext_amount,
			recipient,
			relayer,
			refund,
			unwrapped_token,
			encrypted_output1,
			encrypted_output2,
		}
	}

	pub fn get_encode(&self) -> Uint8Array {
		let codec = self.encode_abi();
		let mut keccak = Keccak::v256();
		keccak.update(codec.as_slice());
		let mut output = [0u8; 32];
		keccak.finalize(&mut output);
		let field_res = Bn254Fr::from_le_bytes_mod_order(&output);
		let value = field_res.into_repr().to_bytes_le();

		Uint8Array::from(value.as_slice())
	}
}
#[allow(clippy::wrong_self_convention)]
pub trait IntoAbiToken {
	fn into_abi(&self) -> Token;
	fn encode_abi(&self) -> Vec<u8> {
		let token = self.into_abi();
		encode(&[token])
	}
}

impl IntoAbiToken for i128 {
	fn into_abi(&self) -> Token {
		let bytes = self.encode();
		let mut bytes32: [u8; 32] = [0; 32];
		for (i, byte) in bytes.iter().enumerate() {
			bytes32[i] = *byte;
		}
		Token::Int(bytes32.into())
	}
}

impl IntoAbiToken for u128 {
	fn into_abi(&self) -> Token {
		let bytes = self.encode();
		let mut bytes32: [u8; 32] = [0; 32];
		for (i, byte) in bytes.iter().enumerate() {
			bytes32[i] = *byte;
		}
		Token::Uint(bytes32.into())
	}
}

impl IntoAbiToken for [u8; 32] {
	fn into_abi(&self) -> Token {
		Token::Bytes(self.to_vec())
	}
}

impl IntoAbiToken for ExtData {
	fn into_abi(&self) -> Token {
		// TODO: Make sure the encodings match the solidity side
		let recipient = Token::Bytes(self.recipient.clone());
		let ext_amount = Token::Bytes(self.ext_amount.encode());
		let relayer = Token::Bytes(self.relayer.clone());
		let fee = Token::Bytes(self.fee.encode());
		let refund = Token::Bytes(self.refund.encode());
		let unwrapped_token = Token::Bytes(self.unwrapped_token.clone());
		let encrypted_output1 = Token::Bytes(self.encrypted_output1.clone());
		let encrypted_output2 = Token::Bytes(self.encrypted_output2.clone());
		let ext_data_args = vec![
			recipient,
			relayer,
			ext_amount,
			fee,
			refund,
			unwrapped_token,
			encrypted_output1,
			encrypted_output2,
		];
		Token::Tuple(ext_data_args)
	}
}
