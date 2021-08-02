use std::convert::TryInto;

use ark_crypto_primitives::crh::injective_map::{PedersenCRHCompressor, TECompressor};
use ark_crypto_primitives::CRH as CRHTrait;
use ark_ff::fields::PrimeField;
use ark_ff::{to_bytes, BigInteger, ToBytes};
use arkworks_gadgets::leaf::mixer::{MixerLeaf, Private};
use arkworks_gadgets::leaf::LeafCreation;
use arkworks_gadgets::poseidon::sbox::PoseidonSbox;
use arkworks_gadgets::poseidon::{PoseidonParameters, Rounds, CRH};
use arkworks_gadgets::prelude::ark_ed_on_bls12_381::{EdwardsProjective, Fq};
use arkworks_gadgets::prelude::ark_std::rand::SeedableRng;
use arkworks_gadgets::prelude::*;
use arkworks_gadgets::utils::{get_mds_poseidon_bls381_x5_5, get_rounds_poseidon_bls381_x5_5};
use pedersen_hash::PedersenWindow;
use rand::rngs::OsRng;

use crate::note::{Hasher, NoteGenerator, OpStatusCode};
use rand::Rng;

pub type PedersenHasher = PedersenCRHCompressor<EdwardsProjective, TECompressor, PedersenWindow>;
pub struct ArcworksPoseidonBls12_381NoteGenerator();
type Leaf = MixerLeaf<Fq, PoseidonCRH5>;
impl Rounds for PoseidonRounds5 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 60;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(5);
	const WIDTH: usize = 5;
}
#[derive(Default, Clone)]
struct PoseidonRounds5;

type PoseidonCRH5 = CRH<Fq, PoseidonRounds5>;
const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
impl NoteGenerator for ArcworksPoseidonBls12_381NoteGenerator {
	fn generate_secrets(&self, rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
		use arkworks_gadgets::ark_std::rand;
		let mut r = rand::rngs::StdRng::from_seed(*SEED);
		let leaf = Leaf::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?;
		let rho: [u8; 32] = leaf
			.rho()
			.into_repr()
			.to_bytes_be() // always use big-endian for bignumbers!!
			.try_into()
			.expect("Hash is always 32 bytes!");
		let nullifier: [u8; 32] = leaf
			.nullifier()
			.into_repr()
			.to_bytes_be() // always use big-endian for bignumbers!!
			.try_into()
			.expect("Hash is always 32 bytes!");
		let r: [u8; 32] = leaf
			.r()
			.into_repr()
			.to_bytes_be() // always use big-endian for bignumbers!!
			.try_into()
			.expect("Hash is always 32 bytes!");
		let all = [rho, nullifier, r].concat();
		let mut all_secrets: Vec<u8> = Vec::new();
		all_secrets.extend_from_slice(&all);
		dbg!(all_secrets.len());
		Ok(all_secrets)
	}
}

impl Hasher for ArcworksPoseidonBls12_381NoteGenerator {
	type HasherOptions = PoseidonParameters<Fq>;

	const SECRET_LENGTH: usize = 0;

	fn hash(&self, secrets: &[u8], params: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		if secrets.len() != 96 {
			return Err(OpStatusCode::InvalidNoteLength);
		}
		let leaf_res = PoseidonCRH5::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?;
		let leaf = leaf_res.into_repr().to_bytes_be();
		Ok(leaf)
	}
}
impl ArcworksPoseidonBls12_381NoteGenerator {
	fn getDefaultParams() -> PoseidonParameters<Fq> {
		let rounds = get_rounds_poseidon_bls381_x5_5::<Fq>();
		let mds = get_mds_poseidon_bls381_x5_5::<Fq>();
		PoseidonParameters::<Fq>::new(rounds, mds)
	}
}
#[cfg(test)]
mod test {
	use super::*;
	use crate::note::NoteBuilder;

	#[test]
	fn test_arch() {
		let note_generator = ArcworksPoseidonBls12_381NoteGenerator {};
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator
			.hash(&secrets, ArcworksPoseidonBls12_381NoteGenerator::getDefaultParams())
			.unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
}
