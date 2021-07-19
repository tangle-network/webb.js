use crate::note::{Hasher, NoteGenerator, OpStatusCode};
use ark_crypto_primitives::crh::injective_map::{PedersenCRHCompressor, TECompressor};
use arkworks_gadgets::leaf::mixer::MixerLeaf;
use arkworks_gadgets::leaf::LeafCreation;
use arkworks_gadgets::poseidon::sbox::PoseidonSbox;
use arkworks_gadgets::poseidon::{PoseidonParameters, Rounds, CRH};
use arkworks_gadgets::prelude::ark_ed_on_bls12_381::{EdwardsProjective, Fq};
use arkworks_gadgets::prelude::ark_std::rand::SeedableRng;
use arkworks_gadgets::prelude::*;
use pedersen_hash::PedersenWindow;
use rand::rngs::OsRng;
use std::convert::TryInto;

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
	fn generate_secrets(&self, _: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
		use arkworks_gadgets::ark_std::rand;
		let mut r = rand::rngs::StdRng::from_seed(*SEED);
		let secrets = Leaf::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?;
		let nullifier = Leaf::create_nullifier(&secrets, &PoseidonParameters::default())
			.map_err(|_| OpStatusCode::SecretGenFailed)?;
		let rio = unimplemented!();
	}
}

impl Hasher for ArcworksPoseidonBls12_381NoteGenerator {
	type HasherOptions = ();

	const SECRET_LENGTH: usize = 0;

	fn hash(&self, secrets: &[u8], _: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		// let sec: Vec<_> =
		// arkworks_gadgets::utils::to_field_elements(secrets).unwrap();
		unimplemented!()
	}
}
#[cfg(test)]
mod test {
	use super::*;
	#[test]
	fn test_arch() {
		let note_generator = ArcworksPoseidonBls12_381NoteGenerator {};
		note_generator.generate_secrets(&mut OsRng::default()).unwrap();
	}
}
