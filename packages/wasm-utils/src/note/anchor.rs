use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::anchor::{setup_leaf_with_privates_raw_x5_4, setup_leaf_x5_4};
use arkworks_gadgets::prelude::ark_bls12_381::Fq as BlsFr;
use arkworks_gadgets::prelude::ark_bn254::Fq as Bn254Fr;
use arkworks_gadgets::prelude::*;
use arkworks_utils::utils::common::Curve as ArkworksCurve;

use crate::types::{Curve, OpStatusCode};

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	rng: &mut OsRng,
) -> Result<Vec<u8>, OpStatusCode> {
	let secrets: Vec<u8> = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 4) => {
			let (secret_bytes, nullifier_bytes, ..) = setup_leaf_x5_4::<BlsFr, _>(ArkworksCurve::Bls381, rng);
			[secret_bytes, nullifier_bytes].concat()
		}
		(Curve::Bn254, 5, 4) => {
			let (secret_bytes, nullifier_bytes, ..) = setup_leaf_x5_4::<Bn254Fr, _>(ArkworksCurve::Bn254, rng);
			[secret_bytes, nullifier_bytes].concat()
		}
		_ => return Err(OpStatusCode::SecretGenFailed),
	};
	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	raw: &[u8],
) -> Result<(Vec<u8>, Vec<u8>), OpStatusCode> {
	unimplemnted!()
}

#[cfg(test)]
mod test {}
