use ark_bls12_381::Fr as BlsFr;
use ark_bn254::Fr as Bn254Fr;
use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::mixer::{setup_leaf_with_privates_raw_x5_5, setup_leaf_x5_5};
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::{Curve, OpStatusCode, OperationError};

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	rng: &mut OsRng,
) -> Result<Vec<u8>, OperationError> {
	let (secret_bytes, nullifier_bytes, ..) = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 5) => setup_leaf_x5_5::<BlsFr, _>(ArkworksCurve::Bls381, rng),
		(Curve::Bn254, 5, 5) => setup_leaf_x5_5::<Bn254Fr, _>(ArkworksCurve::Bn254, rng),
		_ => {
			let mut oe: OperationError = OpStatusCode::SecretGenFailed.into();
			oe.data = Some(format!(
				"Not Mixer leaf setup for curve {}, exponentiation {} , and width {}",
				curve, exponentiation, width
			));
			return Err(oe);
		}
	}
	.map_err(|e| {
		let mut oe: OperationError = OpStatusCode::SecretGenFailed.into();
		oe.data = Some(e.to_string());
		oe
	})?;

	let secrets = [secret_bytes, nullifier_bytes].concat();

	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	raw: &[u8],
) -> Result<(Vec<u8>, Vec<u8>), OperationError> {
	if raw.len() < 64 {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	let secrets = raw[..32].to_vec();
	let nullifer = raw[32..64].to_vec();
	// (leaf_bytes, nullifier_hash_bytes)
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 5) => setup_leaf_with_privates_raw_x5_5::<BlsFr>(ArkworksCurve::Bls381, secrets, nullifer),
		(Curve::Bn254, 5, 5) => setup_leaf_with_privates_raw_x5_5::<Bn254Fr>(ArkworksCurve::Bn254, secrets, nullifer),
		_ => {
			let mut oe: OperationError = OpStatusCode::FailedToGenerateTheLeaf.into();
			oe.data = Some(format!(
				"Not Mixer leaf setup for curve {}, exponentiation {} , and width {}",
				curve, exponentiation, width
			));
			return Err(oe);
		}
	}
	.map_err(|e| {
		let mut oe: OperationError = OpStatusCode::FailedToGenerateTheLeaf.into();
		oe.data = Some(e.to_string());
		oe
	})?;
	Ok(sec)
}

#[cfg(test)]
mod test {}
