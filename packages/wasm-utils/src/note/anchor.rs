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
	let secrets = [chain_id.to_be_bytes().to_vec(), sec.nullifier_bytes, sec.secret_bytes];
	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	raw: &[u8],
	mut chain_id: u128,
) -> Result<Leaf, OperationError> {
	if raw.len() < 64 {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	let secrets;
	let nullifier;
	if raw.len() == 70 {
		// 70 bytes raw implies [6 bytes chain ID, 32 bytes nullifier, 32 bytes secret]
		let mut chain_id_bytes = [0u8; 8];
		chain_id_bytes[2..8].copy_from_slice(&raw[0..6]);
		chain_id = u128::from(u64::from_le_bytes(chain_id_bytes));
		nullifier = raw[6..38].to_vec();
		secrets = raw[38..70].to_vec();
	} else if raw.len() == 72 {
		let mut chain_id_bytes = [0u8; 8];
		chain_id_bytes[0..8].copy_from_slice(&raw[0..8]);
		chain_id = u128::from(u64::from_le_bytes(chain_id_bytes));
		nullifier = raw[8..40].to_vec();
		secrets = raw[40..72].to_vec();
	} else if raw.len() >= 64 {
		// 64 bytes raw implies [32 bytes nullifier, 32 bytes secret]
		secrets = raw[0..32].to_vec();
		nullifier = raw[32..64].to_vec();
	} else {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	// (leaf_bytes, nullifier_hash_bytes)
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 4) => {
			setup_leaf_with_privates_raw_x5_4::<BlsFr>(ArkworksCurve::Bls381, secrets, nullifier, chain_id)
		}
		(Curve::Bn254, 5, 4) => {
			setup_leaf_with_privates_raw_x5_4::<Bn254Fr>(ArkworksCurve::Bn254, secrets, nullifier, chain_id)
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
