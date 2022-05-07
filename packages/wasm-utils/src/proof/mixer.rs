use arkworks_setups::{Curve as ArkCurve, MixerProver};

use rand::rngs::OsRng;

use crate::proof::{MixerProofPayload, Proof};
use crate::types::{Backend, Curve, OpStatusCode, OperationError};
use crate::{MixerR1CSProverBls381_30, MixerR1CSProverBn254_30, DEFAULT_LEAF};

pub fn create_proof(mixer_proof_input: MixerProofPayload, rng: &mut OsRng) -> Result<Proof, OperationError> {
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
	// let (proof, leaf, nullifier_hash, root, public_inputs) = mixer_proof;
	Ok(Proof {
		proof: mixer_proof.proof,
		nullifier_hash: mixer_proof.nullifier_hash_raw,
		root: mixer_proof.root_raw,
		roots: vec![],
		public_inputs: mixer_proof.public_inputs_raw,
		leaf: mixer_proof.leaf_raw,
	})
}
