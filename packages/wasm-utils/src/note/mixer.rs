use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::mixer::{setup_leaf_with_privates_raw_x5_5, setup_leaf_x5_5};
use arkworks_gadgets::prelude::ark_bls12_381::Fr as BlsFr;
use arkworks_gadgets::prelude::ark_bn254::Fr as Bn254Fr;
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::{Curve, OpStatusCode};

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	rng: &mut OsRng,
) -> Result<Vec<u8>, OpStatusCode> {
	let (secret_bytes, nullifier_bytes, ..) = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 5) => setup_leaf_x5_5::<BlsFr, _>(ArkworksCurve::Bls381, rng),
		(Curve::Bn254, 5, 5) => setup_leaf_x5_5::<Bn254Fr, _>(ArkworksCurve::Bn254, rng),
		_ => return Err(OpStatusCode::SecretGenFailed),
	}
	.map_err(|_| OpStatusCode::SecretGenFailed)?;

	let secrets = [secret_bytes, nullifier_bytes].concat();

	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	raw: &[u8],
) -> Result<(Vec<u8>, Vec<u8>), OpStatusCode> {
	if raw.len() < 64 {
		return Err(OpStatusCode::InvalidNoteSecrets);
	}

	let secrets = raw[..32].to_vec();
	let nullifer = raw[32..64].to_vec();
	// (leaf_bytes, nullifier_hash_bytes)
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 5) => setup_leaf_with_privates_raw_x5_5::<BlsFr>(ArkworksCurve::Bls381, secrets, nullifer),
		(Curve::Bn254, 5, 5) => setup_leaf_with_privates_raw_x5_5::<Bn254Fr>(ArkworksCurve::Bn254, secrets, nullifer),
		_ => return Err(OpStatusCode::FailedToGenerateTheLeaf),
	}
	.map_err(|_| OpStatusCode::FailedToGenerateTheLeaf)?;
	Ok(sec)
}

#[cfg(test)]
mod test {}
