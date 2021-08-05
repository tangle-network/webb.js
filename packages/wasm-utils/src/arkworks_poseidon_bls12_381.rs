use std::convert::TryInto;

use ark_crypto_primitives::crh::injective_map::{PedersenCRHCompressor, TECompressor};
use ark_crypto_primitives::CRH as CRHTrait;
use ark_ff::fields::PrimeField;
use ark_ff::{to_bytes, BigInteger, ToBytes};
use arkworks_gadgets::leaf::mixer::{MixerLeaf, Private};
use arkworks_gadgets::leaf::LeafCreation;
use arkworks_gadgets::poseidon::sbox::PoseidonSbox;
use arkworks_gadgets::poseidon::{PoseidonParameters, Rounds, CRH};
use arkworks_gadgets::prelude::ark_bls12_381::{Bls12_381, Fr};
use arkworks_gadgets::prelude::ark_std::rand::SeedableRng;
use arkworks_gadgets::prelude::*;
use arkworks_gadgets::utils::{get_mds_poseidon_bls381_x5_3, get_rounds_poseidon_bls381_x5_3};
use pedersen_hash::PedersenWindow;
use rand::rngs::OsRng;

use crate::note::{LeafHasher, NoteGenerator, OpStatusCode};
use rand::Rng;

pub struct ArkworksPoseidonBls12_381NoteGenerator();
type Leaf = MixerLeaf<Fr, PoseidonCRH3>;
impl Rounds for PoseidonRounds3 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 57;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(5);
	const WIDTH: usize = 3;
}

#[derive(Default, Clone)]
struct PoseidonRounds3;

type PoseidonCRH3 = CRH<Fr, PoseidonRounds3>;
const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
impl NoteGenerator for ArkworksPoseidonBls12_381NoteGenerator {
	fn generate_secrets(&self, rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
		use arkworks_gadgets::ark_std::rand;
		let mut r = rand::rngs::StdRng::from_seed(*SEED);
		let secrets = Leaf::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?;
		let leaf_inputs = to_bytes![
			secrets.r(),
			secrets.nullifier(),
			secrets.rho()
		].unwrap();
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
		let leaf_res = PoseidonCRH3::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?;
		let leaf = leaf_res.into_repr().to_bytes_be();
		Ok(leaf)
	}
}

impl ArkworksPoseidonBls12_381NoteGenerator {
	fn getDefaultParams() -> PoseidonParameters<Fr> {
		let rounds = get_rounds_poseidon_bls381_x5_3::<Fr>();
		let mds = get_mds_poseidon_bls381_x5_3::<Fr>();
		PoseidonParameters::<Fr>::new(rounds, mds)
	}
}

#[cfg(test)]
mod test {
	use super::*;
	use crate::note::NoteBuilder;

	#[test]
	fn test_arch() {
		let note_generator = ArkworksPoseidonBls12_381NoteGenerator {};
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator
			.hash(&secrets, ArkworksPoseidonBls12_381NoteGenerator::getDefaultParams())
			.unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
}
