use ark_crypto_primitives::CRH as CRHTrait;
use ark_ff::to_bytes;
use ark_serialize::CanonicalSerialize;
use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::common::{
	PoseidonCRH_x17_3, PoseidonCRH_x17_5, PoseidonCRH_x3_3, PoseidonCRH_x3_5, PoseidonCRH_x5_3, PoseidonCRH_x5_5,
};
use arkworks_circuits::setup::mixer::setup_leaf_x5;
use arkworks_gadgets::leaf::mixer::{MixerLeaf, Private};
use arkworks_gadgets::prelude::ark_bn254::Fq as Fr;
use arkworks_gadgets::prelude::*;
use arkworks_utils::poseidon::PoseidonParameters;
use arkworks_utils::utils::common::Curve;

use crate::note::{LeafHasher, NoteGenerator, NoteSecretGenerator};
use crate::types::OpStatusCode;
use crate::utils::get_hash_params_x5;

pub struct ArkworksPoseidonBn254NoteGenerator;

impl NoteSecretGenerator for ArkworksPoseidonBn254NoteGenerator {
	fn generate_secrets(width: usize, exponentiation: usize, rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
		let curve = Curve::Bn254;
		let leaf_private: Private<Fr> = match (exponentiation, width) {
			(5, 3) | (5, 5) => {
				let (params_5, params_3) = get_hash_params_x5::<Fr>(curve);
				let (leaf_private, ..) = setup_leaf_x5(&params_5, &mut rng);
				leaf_private
			}
			(..) => {
				unreachable!("unreachable exponentiation {} width {}", width, exponentiation)
			}
		};
		let secrets = to_bytes![leaf_private.secret(), leaf_private.nullifier()].unwrap();
		Ok(secrets)
	}
}

#[cfg(test)]
mod test {}
