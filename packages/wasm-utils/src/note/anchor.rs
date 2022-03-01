use ark_bls12_381::Fr as BlsFr;
use ark_bn254::Fr as Bn254Fr;
use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::anchor::{setup_leaf_with_privates_raw_x5_4, setup_leaf_x5_4};
use arkworks_circuits::setup::common::Leaf;
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::{Curve, OpStatusCode, OperationError};

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	chain_id: u64,
	rng: &mut OsRng,
) -> Result<[Vec<u8>; 3], OperationError> {
	let sec: Leaf = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 4) => setup_leaf_x5_4::<BlsFr, _>(ArkworksCurve::Bls381, u128::from(chain_id), rng),
		(Curve::Bn254, 5, 4) => setup_leaf_x5_4::<Bn254Fr, _>(ArkworksCurve::Bn254, u128::from(chain_id), rng),
		_ => {
			let message = format!(
				"No Anchor secrets setup available for curve {}, exponentiation {}, and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(OpStatusCode::SecretGenFailed, message));
		}
	}
	.map_err(|_| OpStatusCode::SecretGenFailed)?;
	let secrets = [chain_id.to_le_bytes().to_vec(), sec.nullifier_bytes, sec.secret_bytes];
	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	chain_id: u64,
	nullifier_bytes: Vec<u8>,
	secret_bytes: Vec<u8>
) -> Result<Leaf, OperationError> {
	if secret_bytes.len() < 32  || nullifier_bytes.len() < 32 {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	// (leaf_bytes, nullifier_hash_bytes)
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 4) => {
			setup_leaf_with_privates_raw_x5_4::<BlsFr>(ArkworksCurve::Bls381, secret_bytes, nullifier_bytes, u128::from(chain_id))
		}
		(Curve::Bn254, 5, 4) => {
			setup_leaf_with_privates_raw_x5_4::<Bn254Fr>(ArkworksCurve::Bn254, secret_bytes, nullifier_bytes, u128::from(chain_id))
		}
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
