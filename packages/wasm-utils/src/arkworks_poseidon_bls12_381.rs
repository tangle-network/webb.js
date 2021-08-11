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
use arkworks_gadgets::utils::{
	get_mds_poseidon_bls381_x17_3, get_mds_poseidon_bls381_x3_3, get_mds_poseidon_bls381_x3_5,
	get_mds_poseidon_bls381_x5_3, get_mds_poseidon_bls381_x5_5, get_mds_poseidon_bn254_x17_5,
	get_rounds_poseidon_bls381_x17_3, get_rounds_poseidon_bls381_x17_5, get_rounds_poseidon_bls381_x3_3,
	get_rounds_poseidon_bls381_x3_5, get_rounds_poseidon_bls381_x5_3, get_rounds_poseidon_bls381_x5_5,
};
use pedersen_hash::PedersenWindow;
use rand::rngs::OsRng;
use rand::Rng;

use crate::note::{LeafHasher, NoteGenerator, OpStatusCode};

pub struct ArkworksPoseidonBls12_381NoteGenerator<T: Rounds> {
	rounds: T,
}
/// Poseidon width 3

/// 5 3
#[derive(Default, Clone)]
struct PoseidonRounds5_3;
impl Rounds for PoseidonRounds5_3 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 57;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(5);
	const WIDTH: usize = 3;
}
type PoseidonCRH5_3 = CRH<Fr, PoseidonRounds5_3>;

type Leaf5_3 = MixerLeaf<Fr, PoseidonCRH5_3>;

/// 3 3

#[derive(Default, Clone)]
struct PoseidonRounds3_3;

impl Rounds for PoseidonRounds3_3 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 84;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(3);
	const WIDTH: usize = 3;
}
type PoseidonCRH3_3 = CRH<Fr, PoseidonRounds3_3>;

type Leaf3_3 = MixerLeaf<Fr, PoseidonCRH3_3>;

/// Poseidon width 5

// 5 5
#[derive(Default, Clone)]
struct PoseidonRounds5_5;

impl Rounds for PoseidonRounds5_5 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 60;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(5);
	const WIDTH: usize = 5;
}
type PoseidonCRH5_5 = CRH<Fr, PoseidonRounds5_5>;

type Leaf5_5 = MixerLeaf<Fr, PoseidonCRH5_5>;

// 3 5
#[derive(Default, Clone)]
struct PoseidonRounds3_5;

impl Rounds for PoseidonRounds3_5 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 85;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(3);
	const WIDTH: usize = 5;
}
type PoseidonCRH3_5 = CRH<Fr, PoseidonRounds3_5>;

type Leaf3_5 = MixerLeaf<Fr, PoseidonCRH3_5>;
// 17 3
#[derive(Default, Clone)]
struct PoseidonRounds17_3;

impl Rounds for PoseidonRounds17_3 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 33;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(17);
	const WIDTH: usize = 5;
}
type PoseidonCRH17_3 = CRH<Fr, PoseidonRounds17_3>;

type Leaf17_3 = MixerLeaf<Fr, PoseidonCRH17_3>;
// 17 5
#[derive(Default, Clone)]
struct PoseidonRounds17_5;

impl Rounds for PoseidonRounds17_5 {
	const FULL_ROUNDS: usize = 8;
	const PARTIAL_ROUNDS: usize = 35;
	const SBOX: PoseidonSbox = PoseidonSbox::Exponentiation(17);
	const WIDTH: usize = 5;
}
type PoseidonCRH17_5 = CRH<Fr, PoseidonRounds17_5>;

type Leaf17_5 = MixerLeaf<Fr, PoseidonCRH17_5>;

const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
impl<T: Rounds> NoteGenerator for ArkworksPoseidonBls12_381NoteGenerator<T> {
	fn generate_secrets(&self, _rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
		use arkworks_gadgets::ark_std::rand;
		let mut r = rand::rngs::StdRng::from_seed(*SEED);
		let secrets = match (T::SBOX, T::WIDTH) {
			(PoseidonSbox::Exponentiation(5), 3) => {
				Leaf5_3::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?
			}
			(PoseidonSbox::Exponentiation(5), 5) => {
				Leaf5_5::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(3), 3) => {
				Leaf3_3::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(3), 5) => {
				Leaf3_5::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(17), 3) => {
				Leaf17_3::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(17), 5) => {
				Leaf17_5::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?
			}
			_ => {
				unimplemented!()
			}
		};
		let leaf_inputs = to_bytes![secrets.r(), secrets.nullifier(), secrets.rho()].unwrap();
		dbg!(leaf_inputs.len());
		Ok(leaf_inputs)
	}
}

impl<T: Rounds> LeafHasher for ArkworksPoseidonBls12_381NoteGenerator<T> {
	type HasherOptions = PoseidonParameters<Fr>;

	const SECRET_LENGTH: usize = 0;

	fn hash(&self, secrets: &[u8], params: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		if secrets.len() != 96 {
			return Err(OpStatusCode::InvalidNoteLength);
		}
		let leaf_res = match (T::SBOX, T::WIDTH) {
			(PoseidonSbox::Exponentiation(5), 3) => {
				PoseidonCRH5_3::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}
			(PoseidonSbox::Exponentiation(5), 5) => {
				PoseidonCRH5_5::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(3), 3) => {
				PoseidonCRH3_3::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(3), 5) => {
				PoseidonCRH3_5::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(17), 3) => {
				PoseidonCRH17_3::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}

			(PoseidonSbox::Exponentiation(17), 5) => {
				PoseidonCRH17_5::evaluate(&params, &secrets).map_err(|_| OpStatusCode::SecretGenFailed)?
			}
			_ => {
				unimplemented!()
			}
		};
		let leaf = leaf_res.into_repr().to_bytes_be();
		Ok(leaf)
	}
}

impl<T: Rounds> ArkworksPoseidonBls12_381NoteGenerator<T> {
	fn get_params(&self) -> PoseidonParameters<Fr> {
		match (T::SBOX, T::WIDTH) {
			(PoseidonSbox::Exponentiation(5), 3) => {
				let rounds = get_rounds_poseidon_bls381_x5_3::<Fr>();
				let mds = get_mds_poseidon_bls381_x5_3::<Fr>();
				PoseidonParameters::<Fr>::new(rounds, mds)
			}
			(PoseidonSbox::Exponentiation(5), 5) => {
				let rounds = get_rounds_poseidon_bls381_x5_5::<Fr>();
				let mds = get_mds_poseidon_bls381_x5_5::<Fr>();
				PoseidonParameters::<Fr>::new(rounds, mds)
			}
			(PoseidonSbox::Exponentiation(3), 3) => {
				let rounds = get_rounds_poseidon_bls381_x3_3::<Fr>();
				let mds = get_mds_poseidon_bls381_x3_3::<Fr>();
				PoseidonParameters::<Fr>::new(rounds, mds)
			}
			(PoseidonSbox::Exponentiation(3), 5) => {
				let rounds = get_rounds_poseidon_bls381_x3_5::<Fr>();
				let mds = get_mds_poseidon_bls381_x3_5::<Fr>();
				PoseidonParameters::<Fr>::new(rounds, mds)
			}
			(PoseidonSbox::Exponentiation(17), 3) => {
				let rounds = get_rounds_poseidon_bls381_x17_3::<Fr>();
				let mds = get_mds_poseidon_bls381_x17_3::<Fr>();
				PoseidonParameters::<Fr>::new(rounds, mds)
			}
			(PoseidonSbox::Exponentiation(17), 5) => {
				let rounds = get_rounds_poseidon_bls381_x17_5::<Fr>();
				let mds = get_mds_poseidon_bn254_x17_5::<Fr>();
				PoseidonParameters::<Fr>::new(rounds, mds)
			}
			_ => {
				unreachable!()
			}
		}
	}

	fn set_up(rounds: T) -> Self {
		Self { rounds }
	}
}

#[cfg(test)]
mod test {
	use crate::note::NoteBuilder;

	use super::*;

	#[test]
	fn test_arch() {
		#[test]
		fn arkworks_poseidon_bls12_381_note_generator_5x_3() {
			let note_generator = ArkworksPoseidonBls12_381NoteGenerator::set_up(PoseidonRounds5_3);
			let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
			let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
			let note = note_generator
				.generate(&NoteBuilder::default(), &mut OsRng::default())
				.unwrap();
			dbg!(note.to_string());
		}
		#[test]
		fn arkworks_poseidon_bls12_381_note_generator_5x_5() {
			let note_generator = ArkworksPoseidonBls12_381NoteGenerator::set_up(PoseidonRounds5_5);
			let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
			let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
			let note = note_generator
				.generate(&NoteBuilder::default(), &mut OsRng::default())
				.unwrap();
			dbg!(note.to_string());
		}
		#[test]
		fn arkworks_poseidon_bls12_381_note_generator_3x_3() {
			let note_generator = ArkworksPoseidonBls12_381NoteGenerator::set_up(PoseidonRounds3_3);
			let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
			let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
			let note = note_generator
				.generate(&NoteBuilder::default(), &mut OsRng::default())
				.unwrap();
			dbg!(note.to_string());
		}
		#[test]
		fn arkworks_poseidon_bls12_381_note_generator_3x_5() {
			let note_generator = ArkworksPoseidonBls12_381NoteGenerator::set_up(PoseidonRounds3_5);
			let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
			let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
			let note = note_generator
				.generate(&NoteBuilder::default(), &mut OsRng::default())
				.unwrap();
			dbg!(note.to_string());
		}
		#[test]
		fn arkworks_poseidon_bls12_381_note_generator_17x_3() {
			let note_generator = ArkworksPoseidonBls12_381NoteGenerator::set_up(PoseidonRounds17_3);
			let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
			let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
			let note = note_generator
				.generate(&NoteBuilder::default(), &mut OsRng::default())
				.unwrap();
			dbg!(note.to_string());
		}

		#[test]
		fn arkworks_poseidon_bls12_381_note_generator_17x_5() {
			let note_generator = ArkworksPoseidonBls12_381NoteGenerator::set_up(PoseidonRounds17_5);
			let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
			let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
			let note = note_generator
				.generate(&NoteBuilder::default(), &mut OsRng::default())
				.unwrap();
			dbg!(note.to_string());
		}
	}
}
