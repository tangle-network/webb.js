use ark_std::rand::rngs::OsRng;
use arkworks_setups::common::AnchorLeaf;

use crate::AnchorR1CSProverBls381_30_2;
use crate::AnchorR1CSProverBn254_30_2;
use arkworks_setups::AnchorProver;
use arkworks_setups::Curve as ArkCurve;

use crate::types::{Curve, OpStatusCode, OperationError};

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	chain_id: u64,
	rng: &mut OsRng,
) -> Result<[Vec<u8>; 3], OperationError> {
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 4) => AnchorR1CSProverBls381_30_2::create_random_leaf(ArkCurve::Bls381, chain_id, rng),
		(Curve::Bn254, 5, 4) => AnchorR1CSProverBn254_30_2::create_random_leaf(ArkCurve::Bn254, chain_id, rng),
		_ => {
			let message = format!(
				"No Anchor secrets setup available for curve {}, exponentiation {}, and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(OpStatusCode::SecretGenFailed, message));
		}
	}
	.map_err(|_| OpStatusCode::SecretGenFailed)?;
	let secrets = [chain_id.to_be_bytes().to_vec(), sec.nullifier_bytes, sec.secret_bytes];
	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	chain_id: u64,
	nullifier_bytes: Vec<u8>,
	secret_bytes: Vec<u8>,
) -> Result<AnchorLeaf, OperationError> {
	if secret_bytes.len() < 32 || nullifier_bytes.len() < 32 {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	// (leaf_bytes, nullifier_hash_bytes)
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 4) => AnchorR1CSProverBls381_30_2::create_leaf_with_privates(
			ArkCurve::Bls381,
			chain_id,
			secret_bytes,
			nullifier_bytes,
		),
		(Curve::Bn254, 5, 4) => AnchorR1CSProverBls381_30_2::create_leaf_with_privates(
			ArkCurve::Bn254,
			chain_id,
			secret_bytes,
			nullifier_bytes,
		),
		_ => {
			let message = format!(
				"No Anchor leaf setup available for curve {}, exponentiation {} , and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(
				OpStatusCode::FailedToGenerateTheLeaf,
				message,
			));
		}
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::FailedToGenerateTheLeaf, e.to_string()))?;
	Ok(sec)
}
#[cfg(test)]
mod test {}
