use crate::proof::truncate_and_pad;
use crate::types::{Backend, Curve, OpStatusCode, OperationError};
use crate::{MixerR1CSProverBls381_30, MixerR1CSProverBn254_30, DEFAULT_LEAF};
use arkworks_setups::{Curve as ArkCurve, MixerProver};
use js_sys::{Array, JsString, Uint8Array};
use rand::rngs::OsRng;
use wasm_bindgen::prelude::*;

#[allow(clippy::unused_unit)]
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct MixerProof {
	#[wasm_bindgen(skip)]
	pub proof: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub nullifier_hash: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub root: Vec<u8>,
	#[wasm_bindgen(skip)]
	pub public_inputs: Vec<Vec<u8>>,
	#[wasm_bindgen(skip)]
	pub leaf: Vec<u8>,
}
#[wasm_bindgen]
impl MixerProof {
	#[wasm_bindgen(getter)]
	pub fn proof(&self) -> JsString {
		let proof_bytes = hex::encode(&self.proof);
		proof_bytes.into()
	}

	#[wasm_bindgen(js_name = nullifierHash)]
	#[wasm_bindgen(getter)]
	pub fn nullifier_hash(&self) -> JsString {
		let nullifier_bytes = hex::encode(&self.nullifier_hash);
		nullifier_bytes.into()
	}

	#[wasm_bindgen(getter)]
	pub fn root(&self) -> JsString {
		let root = hex::encode(&self.root);
		root.into()
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = publicInputs)]
	pub fn public_inputs_raw(&self) -> Array {
		let inputs: Array = self
			.public_inputs
			.iter()
			.map(|x| JsString::from(hex::encode(x)))
			.collect();
		inputs
	}

	#[wasm_bindgen(getter)]
	#[wasm_bindgen(js_name = leaf)]
	pub fn leaf(&self) -> Uint8Array {
		let leaf = Uint8Array::from(self.leaf.as_slice());
		leaf
	}
}

#[derive(Debug, Clone)]
pub struct MixerProofPayload {
	pub exponentiation: i8,
	pub width: usize,
	pub curve: Curve,
	pub backend: Backend,
	pub secret: Vec<u8>,
	pub nullifier: Vec<u8>,
	pub recipient: Vec<u8>,
	pub relayer: Vec<u8>,
	pub pk: Vec<u8>,
	pub refund: u128,
	pub fee: u128,
	pub chain_id: u128,
	pub leaves: Vec<Vec<u8>>,
	pub leaf_index: u64,
}

#[derive(Debug, Clone, Default)]
pub struct MixerProofInput {
	pub exponentiation: Option<i8>,
	pub width: Option<usize>,
	pub curve: Option<Curve>,
	pub backend: Option<Backend>,
	pub secret: Option<Vec<u8>>,
	pub nullifier: Option<Vec<u8>>,
	pub recipient: Option<Vec<u8>>,
	pub relayer: Option<Vec<u8>>,
	pub pk: Option<Vec<u8>>,
	pub refund: Option<u128>,
	pub fee: Option<u128>,
	pub chain_id: Option<u128>,
	pub leaves: Option<Vec<Vec<u8>>>,
	pub leaf_index: Option<u64>,
}

impl MixerProofInput {
	pub fn build(self) -> Result<MixerProofPayload, OperationError> {
		let pk = self.pk.ok_or(OpStatusCode::InvalidProvingKey)?;
		let recipient = self.recipient.ok_or(OpStatusCode::InvalidRecipient)?;
		let relayer = self.relayer.ok_or(OpStatusCode::InvalidRelayer)?;
		let leaf_index = self.leaf_index.ok_or(OpStatusCode::InvalidLeafIndex)?;
		let secret = self.secret.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let nullifier = self.nullifier.ok_or(OpStatusCode::InvalidNoteSecrets)?;
		let leaves = self.leaves.ok_or(OpStatusCode::InvalidLeaves)?;
		let fee = self.fee.ok_or(OpStatusCode::InvalidFee)?;
		let refund = self.refund.ok_or(OpStatusCode::InvalidRefund)?;

		let exponentiation = self.exponentiation.unwrap_or(5);
		let width = self.width.unwrap_or(3);
		let curve = self.curve.unwrap_or(Curve::Bn254);
		let backend = self.backend.unwrap_or(Backend::Arkworks);

		let processed_relayer = truncate_and_pad(&relayer);
		let processed_recipient = truncate_and_pad(&recipient);

		Ok(MixerProofPayload {
			exponentiation,
			width,
			curve,
			backend,
			secret,
			nullifier,
			recipient: processed_recipient,
			relayer: processed_relayer,
			pk,
			refund,
			fee,
			chain_id: 0,
			leaves,
			leaf_index,
		})
	}
}

pub fn create_proof(mixer_proof_input: MixerProofPayload, rng: &mut OsRng) -> Result<MixerProof, OperationError> {
	let MixerProofPayload {
		recipient,
		relayer,
		leaves,
		leaf_index,
		fee,
		refund,
		pk,
		secret,
		nullifier,
		backend,
		curve,
		exponentiation,
		width,
		..
	} = mixer_proof_input;

	let mixer_proof = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 3) => MixerR1CSProverBn254_30::create_proof(
			ArkCurve::Bn254,
			secret,
			nullifier,
			leaves,
			leaf_index,
			recipient,
			relayer,
			fee,
			refund,
			pk,
			DEFAULT_LEAF,
			rng,
		),
		(Backend::Arkworks, Curve::Bls381, 5, 3) => MixerR1CSProverBls381_30::create_proof(
			ArkCurve::Bls381,
			secret,
			nullifier,
			leaves,
			leaf_index,
			recipient,
			relayer,
			fee,
			refund,
			pk,
			DEFAULT_LEAF,
			rng,
		),
		_ => return Err(OpStatusCode::UnsupportedParameterCombination.into()),
	}
	.map_err(|e| {
		let mut error: OperationError = OpStatusCode::InvalidProofParameters.into();
		error.data = Some(e.to_string());
		error
	})?;

	Ok(MixerProof {
		proof: mixer_proof.proof,
		nullifier_hash: mixer_proof.nullifier_hash_raw,
		root: mixer_proof.root_raw,
		public_inputs: mixer_proof.public_inputs_raw,
		leaf: mixer_proof.leaf_raw,
	})
}
