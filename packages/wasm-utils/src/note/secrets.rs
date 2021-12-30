use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::mixer::{setup_leaf, setup_leaf_with_privates_raw};
use arkworks_gadgets::prelude::ark_bls12_381::Fq as BlsFr;
use arkworks_gadgets::prelude::ark_bn254::Fq as Bn254Fr;
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::{Curve, OpStatusCode};
use crate::utils::get_hash_params_x5;

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	rng: &mut OsRng,
) -> Result<Vec<u8>, OpStatusCode> {
	let secrets: Vec<u8> = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 5) => {
			let (params_5, ..) = get_hash_params_x5::<BlsFr>(ArkworksCurve::Bls381);
			let (secret_bytes, nullifier_bytes, ..) = setup_leaf(&params_5, rng);
			[secret_bytes, nullifier_bytes].concat()
		}
		(Curve::Bn254, 5, 5) => {
			let (params_5, ..) = get_hash_params_x5::<Bn254Fr>(ArkworksCurve::Bn254);
			let (secret_bytes, nullifier_bytes, ..) = setup_leaf(&params_5, rng);
			[secret_bytes, nullifier_bytes].concat()
		}
		_ => {
			unreachable!(
				"unreachable curve {} exponentiation {} width {}",
				curve, exponentiation, width
			)
		}
	};
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
		(Curve::Bls381, 5, 5) => {
			let (params5, ..) = get_hash_params_x5::<BlsFr>(ArkworksCurve::Bls381);
			setup_leaf_with_privates_raw::<BlsFr>(&params5, secrets, nullifer)
		}
		(Curve::Bn254, 5, 5) => {
			let (params5, ..) = get_hash_params_x5::<Bn254Fr>(ArkworksCurve::Bn254);
			setup_leaf_with_privates_raw::<Bn254Fr>(&params5, secrets, nullifer)
		}
		_ => {
			unreachable!("unreachable Curve Curve25519")
		}
	};
	Ok(sec)
}

#[cfg(test)]
mod test {}
