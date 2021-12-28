use crate::types::Curve;
use ark_ff::to_bytes;
use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::mixer::setup_leaf_x5;
use arkworks_gadgets::prelude::ark_bls12_381::Fq as BlsFr;
use arkworks_gadgets::prelude::ark_bn254::Fq as Bn254Fr;
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::OpStatusCode;
use crate::utils::get_hash_params_x5;

pub fn generate_secrets(exponentiation: usize, curve: Curve, rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
	let secrets: Vec<u8> = match (curve, exponentiation) {
		(Curve::Bls381, 3) => {
			let (params_5, ..) = get_hash_params_x5::<BlsFr>(ArkworksCurve::Bls381);
			let (leaf_private, ..) = setup_leaf_x5(&params_5, rng);
			to_bytes![leaf_private.secret(), leaf_private.nullifier()].unwrap()
		}
		(Curve::Bn254, 3) => {
			let (params_5, ..) = get_hash_params_x5::<Bn254Fr>(ArkworksCurve::Bn254);
			let (leaf_private, ..) = setup_leaf_x5(&params_5, rng);
			to_bytes![leaf_private.secret(), leaf_private.nullifier()].unwrap()
		}
		(..) => {
			unreachable!("unreachable exponentiation {}", exponentiation)
		}
	};
	Ok(secrets)
}

#[cfg(test)]
mod test {}
