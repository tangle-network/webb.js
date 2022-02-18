use arkworks_circuits::setup::common::MixerProof;
use arkworks_circuits::setup::mixer::setup_proof_x5_5;
use arkworks_utils::prelude::ark_bls12_381::Bls12_381;
use arkworks_utils::prelude::ark_bn254::Bn254;
use arkworks_utils::utils::common::Curve as ArkCurve;
use rand::rngs::OsRng;

use crate::proof::{MixerProofInput, Proof};
use crate::types::{Backend, Curve, OpStatusCode, OperationError};

pub fn create_proof(mixer_proof_input: MixerProofInput, rng: &mut OsRng) -> Result<Proof, OperationError> {
	let MixerProofInput {
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

	let mixer_proof: MixerProof = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 5) => setup_proof_x5_5::<Bn254, OsRng>(
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
			rng,
		),
		(Backend::Arkworks, Curve::Bls381, 5, 5) => setup_proof_x5_5::<Bls12_381, OsRng>(
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
			rng,
		),
		_ => return Err(OpStatusCode::InvalidProofParameters.into()),
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
