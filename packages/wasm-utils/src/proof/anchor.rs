use std::convert::TryInto;

use arkworks_setups::Curve as ArkCurve;
use rand::rngs::OsRng;

use crate::{AnchorR1CSProverBls381_30_2, AnchorR1CSProverBn254_30_2, DEFAULT_LEAF};
use arkworks_setups::AnchorProver;

use crate::proof::{AnchorProofInput, Proof};
use crate::types::{Backend, Curve, OpStatusCode, OperationError};

pub fn create_proof(anchor_proof_input: AnchorProofInput, rng: &mut OsRng) -> Result<Proof, OperationError> {
	let AnchorProofInput {
		exponentiation,
		width,
		curve,
		backend,
		secret,
		nullifier,
		recipient: recipient_raw,
		relayer: relayer_raw,
		pk,
		refund,
		fee,
		chain_id,
		leaves,
		leaf_index,
		roots,
		refresh_commitment,
	} = anchor_proof_input;
	let roots_array: [Vec<u8>; 2] = roots.try_into().map_err(|_| OpStatusCode::InvalidProofParameters)?;

	let anchor_proof = match (backend, curve, exponentiation, width) {
		(Backend::Arkworks, Curve::Bn254, 5, 4) => AnchorR1CSProverBn254_30_2::create_proof(
			ArkCurve::Bn254,
			chain_id,
			secret,
			nullifier,
			leaves,
			leaf_index,
			roots_array,
			recipient_raw,
			relayer_raw,
			fee,
			refund,
			refresh_commitment.to_vec(),
			pk,
			DEFAULT_LEAF,
			rng,
		),
		(Backend::Arkworks, Curve::Bls381, 5, 4) => AnchorR1CSProverBls381_30_2::create_proof(
			ArkCurve::Bls381,
			chain_id,
			secret,
			nullifier,
			leaves,
			leaf_index,
			roots_array,
			recipient_raw,
			relayer_raw,
			fee,
			refund,
			refresh_commitment.to_vec(),
			pk,
			DEFAULT_LEAF,
			rng,
		),
		_ => return Err(OpStatusCode::InvalidProofParameters.into()),
	}
	.map_err(|e| {
		let mut error: OperationError = OpStatusCode::InvalidProofParameters.into();
		error.data = Some(format!("Anchor {}", e));
		error
	})?;
	Ok(Proof {
		proof: anchor_proof.proof,
		nullifier_hash: anchor_proof.nullifier_hash_raw,
		root: anchor_proof.roots_raw[0].clone(),
		roots: anchor_proof.roots_raw,
		public_inputs: anchor_proof.public_inputs_raw,
		leaf: anchor_proof.leaf_raw,
	})
}
