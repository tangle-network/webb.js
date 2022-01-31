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
		secrets,
		nullifier,
		backend,
		curve,
		exponentiation,
		width,
		..
	} = mixer_proof_input;

	let (proof, leaf, nullifier_hash, root, public_inputs) = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 5) => setup_proof_x5_5::<Bn254, OsRng>(
			ArkCurve::Bn254,
			secrets,
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
			secrets,
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
	Ok(Proof {
		proof,
		nullifier_hash,
		root: root.clone(),
		roots: vec![root],
		public_inputs,
		leaf,
	})
}
