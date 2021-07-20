use std::convert::TryInto;

use ark_crypto_primitives::crh::injective_map::{PedersenCRHCompressor, TECompressor};
use ark_crypto_primitives::CRH as CRHTrait;
use ark_ff::fields::PrimeField;
use ark_ff::{to_bytes, ToBytes};
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
		let mut r: [u8; 32] = [0; 32];
		let mut nullifier: [u8; 32] = [0; 32];
		let mut rho: [u8; 32] = [0; 32];
		rng.fill(&mut r);
		rng.fill(&mut nullifier);
		rng.fill(&mut rho);
		let full = [r, nullifier, rho].concat();
		let mut full_secret: Vec<u8> = Vec::new();
		full_secret.extend_from_slice(&full);
		Ok(full_secret)
	}
}

impl Hasher for ArcworksPoseidonBls12_381NoteGenerator {
	type HasherOptions = PoseidonParameters<Fq>;

	const SECRET_LENGTH: usize = 0;

	fn hash(&self, secrets: &[u8], params: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		if secrets.len() != 96 {
			return Err(OpStatusCode::InvalidNoteLength);
		}
		let mut r: [u8; 32] = [0; 32];
		let mut nullifier: [u8; 32] = [0; 32];
		let mut rho: [u8; 32] = [0; 32];
		r.clone_from_slice(&secrets[..32]);
		nullifier.clone_from_slice(&secrets[32..64]);
		rho.clone_from_slice(&secrets[64..]);
		let leaf_inputs = to_bytes![r, nullifier, rho].unwrap();
		let leaf_res = PoseidonCRH5::evaluate(&params, &leaf_inputs).unwrap();
		let leaf_bytes = leaf_res.0.as_byte_slice();
		let mut leaf = Vec::new();
		leaf.extend_from_slice(&leaf_bytes);
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
