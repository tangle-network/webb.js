use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::mixer::{setup_leaf, setup_leaf_with_privates_raw};
use arkworks_gadgets::prelude::ark_bls12_381::Fq as BlsFr;
use arkworks_gadgets::prelude::ark_bn254::Fq as Bn254Fr;
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::{Curve, OpStatusCode};
use crate::utils::get_hash_params_x5;

pub fn generate_secrets(exponentiation: usize, curve: Curve, rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
	let secrets: Vec<u8> = match (curve, exponentiation) {
		(Curve::Bls381, 5) => {
			let (params_5, ..) = get_hash_params_x5::<BlsFr>(ArkworksCurve::Bls381);
			let (secret_bytes, nullifier_bytes, ..) = setup_leaf(&params_5, rng);
			[secret_bytes, nullifier_bytes].concat()
		}
		(Curve::Bn254, 5) => {
			let (params_5, ..) = get_hash_params_x5::<Bn254Fr>(ArkworksCurve::Bn254);
			let (secret_bytes, nullifier_bytes, ..) = setup_leaf(&params_5, rng);
			[secret_bytes, nullifier_bytes].concat()
		}
		(..) => {
			unreachable!("unreachable exponentiation {}", exponentiation)
		}
	};
	Ok(secrets)
}
pub fn get_leaf_with_private_raw(curve: Curve, _exponentiation: i8, raw: &[u8]) -> (Vec<u8>, Vec<u8>) {
	let secrets = raw[..32].to_vec();
	let nullifer = raw[32..64].to_vec();
	// todo consume the exponentiation parameters if needed in the future
	return match curve {
		Curve::Bls381 => {
			let (params5, ..) = get_hash_params_x5::<BlsFr>(ArkworksCurve::Bls381);
			setup_leaf_with_privates_raw::<BlsFr, OsRng>(&params5, secrets, nullifer)
		}
		Curve::Bn254 => {
			let (params5, ..) = get_hash_params_x5::<Bn254Fr>(ArkworksCurve::Bn254);
			setup_leaf_with_privates_raw::<Bn254Fr, OsRng>(&params5, secrets, nullifer)
		}
		Curve::Curve25519 => {
			unreachable!("unreachable Curve Curve25519")
		}
	};
}

#[cfg(test)]
mod test {}
