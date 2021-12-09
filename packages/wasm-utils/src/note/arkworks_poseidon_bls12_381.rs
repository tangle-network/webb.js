use ark_crypto_primitives::CRH as CRHTrait;
use ark_ff::fields::PrimeField;
use ark_ff::{to_bytes, BigInteger};
use ark_serialize::CanonicalSerialize;
use arkworks_gadgets::leaf::mixer::{MixerLeaf, Private};
use arkworks_gadgets::prelude::ark_bls12_381::Fq as Fr;
use arkworks_gadgets::prelude::*;

use crate::note::{LeafHasher, NoteGenerator};
use crate::types::OpStatusCode;
use ark_crypto_primitives::crh::poseidon::sbox::PoseidonSbox;
use ark_std::rand::rngs::OsRng;
use arkworks_circuits::setup::common::{
	PoseidonCRH_x17_3, PoseidonCRH_x17_5, PoseidonCRH_x3_3, PoseidonCRH_x3_5, PoseidonCRH_x5_3, PoseidonCRH_x5_5,
};
use arkworks_utils::poseidon::PoseidonParameters;
use arkworks_utils::utils::common::{
	setup_params_x17_3, setup_params_x17_5, setup_params_x3_3, setup_params_x3_5, setup_params_x5_5, Curve,
};
use arkworks_utils::Rounds;

const SEED: &[u8; 32] = b"WebbToolsPoseidonHasherSeed00000";

pub struct ArkworksPoseidonBls12_381NoteGenerator {
	exponentiation: usize,
	width: usize,
}
type Leaf5_3 = MixerLeaf<Fr, PoseidonCRH_x5_3<Fr>>;
type Leaf5_5 = MixerLeaf<Fr, PoseidonCRH_x5_5<Fr>>;
type Leaf3_3 = MixerLeaf<Fr, PoseidonCRH_x3_3<Fr>>;
type Leaf3_5 = MixerLeaf<Fr, PoseidonCRH_x3_5<Fr>>;
type Leaf17_5 = MixerLeaf<Fr, PoseidonCRH_x17_5<Fr>>;
type Leaf17_3 = MixerLeaf<Fr, PoseidonCRH_x17_3<Fr>>;

impl NoteGenerator for ArkworksPoseidonBls12_381NoteGenerator {
	type Rng = OsRng;

	fn get_rng(&self) -> Self::Rng {
		OsRng
	}

	fn generate_secrets(&self, r: &mut Self::Rng) -> Result<Vec<u8>, OpStatusCode> {
		let private = Private::<Fr>::generate(r);
		let leaf_inputs = to_bytes![private.secret(), private.nullifier()].unwrap();
		dbg!(leaf_inputs.len());
		Ok(leaf_inputs)
	}
}

impl LeafHasher for ArkworksPoseidonBls12_381NoteGenerator {
	type HasherOptions = PoseidonParameters<Fr>;

	const SECRET_LENGTH: usize = 0;

	fn hash(&self, secrets: &[u8], params: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		if secrets.len() != 96 {
			return Err(OpStatusCode::InvalidNoteLength);
		}
		let leaf = match (self.exponentiation, self.width) {
			(5, 3) => PoseidonCRH_x5_3::<Fr>::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(5, 5) => PoseidonCRH_x5_5::<Fr>::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(3, 3) => PoseidonCRH_x3_3::<Fr>::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(3, 5) => PoseidonCRH_x3_5::<Fr>::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(17, 3) => {
				PoseidonCRH_x17_3::<Fr>::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}
			(17, 5) => {
				PoseidonCRH_x17_3::<Fr>::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}
			_ => {
				unimplemented!()
			}
		};
		let mut leaf_bytes = Vec::new();
		CanonicalSerialize::serialize(&leaf, &mut leaf_bytes);
		Ok(leaf_bytes)
	}
}

impl ArkworksPoseidonBls12_381NoteGenerator {
	pub fn get_params(&self) -> PoseidonParameters<Fr> {
		match (self.exponentiation, self.width) {
			(5, 3) => setup_params_x3_3::<Fr>(Curve::Bls381),
			(5, 5) => setup_params_x5_5::<Fr>(Curve::Bls381),
			(3, 3) => setup_params_x3_3::<Fr>(Curve::Bls381),
			(3, 5) => setup_params_x3_5::<Fr>(Curve::Bls381),
			(17, 3) => setup_params_x17_3::<Fr>(Curve::Bls381),
			(17, 5) => setup_params_x17_5::<Fr>(Curve::Bls381),
			_ => {
				unreachable!()
			}
		}
	}

	pub fn new(exponentiation: usize, width: usize) -> Self {
		Self { exponentiation, width }
	}
}

#[cfg(test)]
mod test {

	use crate::note::NoteBuilder;

	use super::*;
	use ark_serialize::CanonicalSerializeHashExt;

	const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
}
