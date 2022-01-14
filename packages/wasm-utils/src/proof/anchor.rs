use arkworks_circuits::setup::anchor::setup_proof_x5_4;
use arkworks_utils::prelude::ark_bls12_381::Bls12_381;
use arkworks_utils::prelude::ark_bn254::Bn254;
use arkworks_utils::utils::common::Curve as ArkCurve;
use rand::rngs::OsRng;

use crate::proof::{AnchorProofInput, Proof};
use crate::types::{Backend, Curve, OpStatusCode};

pub fn create_proof(anchor_proof_input: AnchorProofInput, rng: &mut OsRng) -> Result<Proof, OpStatusCode> {
	//		(proof,leaf_raw,nullifier_hash_raw,root_raw,roots_raw,public_inputs_raw)
	let AnchorProofInput {
		exponentiation,
		width,
		curve,
		backend,
		secrets,
		nullifier,
		recipient_raw,
		relayer_raw,
		pk,
		refund,
		fee,
		chain_id,
		leaves,
		leaf_index,
		roots,
		commitment,
	} = anchor_proof_input;
	let (proof, leaf, nullifier_hash, root, roots_raw, public_inputs) = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 4) => setup_proof_x5_4::<Bn254, OsRng>(
			ArkCurve::Bn254,
			chain_id,
			secrets,
			nullifier,
			leaves,
			leaf_index,
			roots,
			recipient_raw,
			relayer_raw,
			commitment.to_vec(),
			fee,
			refund,
			pk,
			rng,
		),
		(Backend::Arkworks, Curve::Bls381, 5, 4) => setup_proof_x5_4::<Bls12_381, OsRng>(
			ArkCurve::Bls381,
			chain_id,
			secrets,
			nullifier,
			leaves,
			leaf_index,
			roots,
			recipient_raw,
			relayer_raw,
			commitment.to_vec(),
			fee,
			refund,
			pk,
			rng,
		),
		_ => return Err(OpStatusCode::InvalidProofParameters),
	}
	.map_err(|_| OpStatusCode::InvalidProofParameters)?;
	Ok(Proof {
		proof,
		nullifier_hash,
		root,
		public_inputs,
		leaf,
	})
}
