use std::convert::TryInto;

use crate::note::{LeafHasher, NoteGenerator, OpStatusCode};
use ark_crypto_primitives::crh::injective_map::{PedersenCRHCompressor, TECompressor};
use ark_crypto_primitives::CRH as CRHTrait;
use ark_ff::fields::PrimeField;
use ark_ff::{to_bytes, BigInteger, ToBytes};
use arkworks_gadgets::leaf::mixer::{MixerLeaf, Private};
use arkworks_gadgets::leaf::LeafCreation;
use arkworks_gadgets::poseidon::sbox::PoseidonSbox;
use arkworks_gadgets::poseidon::{PoseidonParameters, Rounds, CRH};
use arkworks_gadgets::prelude::ark_bn254::{Bn254, Fr};
use arkworks_gadgets::prelude::ark_std::rand::SeedableRng;
use arkworks_gadgets::prelude::*;
use arkworks_gadgets::setup::common::{
	setup_params_x17_3, setup_params_x17_5, setup_params_x3_3, setup_params_x3_5, setup_params_x5_5, Curve,
	PoseidonCRH_x17_3, PoseidonCRH_x17_5, PoseidonCRH_x3_3, PoseidonCRH_x3_5, PoseidonCRH_x5_3, PoseidonCRH_x5_5,
	PoseidonRounds_x17_3, PoseidonRounds_x17_5, PoseidonRounds_x3_3, PoseidonRounds_x3_5, PoseidonRounds_x5_3,
	PoseidonRounds_x5_5,
};
use arkworks_gadgets::utils::{
	get_mds_poseidon_bn254_x17_3, get_mds_poseidon_bn254_x17_5, get_mds_poseidon_bn254_x3_3,
	get_mds_poseidon_bn254_x3_5, get_mds_poseidon_bn254_x5_3, get_mds_poseidon_bn254_x5_5,
	get_rounds_poseidon_bls381_x3_3, get_rounds_poseidon_bls381_x3_5, get_rounds_poseidon_bn254_x17_3,
	get_rounds_poseidon_bn254_x17_5, get_rounds_poseidon_bn254_x3_3, get_rounds_poseidon_bn254_x3_5,
	get_rounds_poseidon_bn254_x5_3, get_rounds_poseidon_bn254_x5_5,
};
use pedersen_hash::PedersenWindow;
use rand::rngs::OsRng;
use rand::Rng;

pub struct ArkworksPoseidonBn254NoteGenerator {
	exponentiation: usize,
	width: usize,
}
type Leaf5_3 = MixerLeaf<Fr, PoseidonCRH_x5_3<Fr>>;
type Leaf5_5 = MixerLeaf<Fr, PoseidonCRH_x5_5<Fr>>;
type Leaf3_3 = MixerLeaf<Fr, PoseidonCRH_x3_3<Fr>>;
type Leaf3_5 = MixerLeaf<Fr, PoseidonCRH_x3_5<Fr>>;
type Leaf17_5 = MixerLeaf<Fr, PoseidonCRH_x17_5<Fr>>;
type Leaf17_3 = MixerLeaf<Fr, PoseidonCRH_x17_3<Fr>>;

const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
impl NoteGenerator for ArkworksPoseidonBn254NoteGenerator {
	fn generate_secrets(&self, _rng: &mut OsRng) -> Result<Vec<u8>, OpStatusCode> {
		use arkworks_gadgets::ark_std::rand;
		let mut r = rand::rngs::StdRng::from_seed(*SEED);

		let secrets = match (self.exponentiation, self.width) {
			(5, 3) => Leaf5_3::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(5, 5) => Leaf5_5::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(3, 3) => Leaf3_3::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(3, 5) => Leaf3_5::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(17, 3) => Leaf17_3::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?,
			(17, 5) => Leaf17_5::generate_secrets(&mut r).map_err(|_| OpStatusCode::SecretGenFailed)?,
			_ => {
				unimplemented!()
			}
		};
		let leaf_inputs = to_bytes![secrets.r(), secrets.nullifier(), secrets.rho()].unwrap();
		dbg!(leaf_inputs.len());
		Ok(leaf_inputs)
	}
}

impl LeafHasher for ArkworksPoseidonBn254NoteGenerator {
	type HasherOptions = PoseidonParameters<Fr>;

	const SECRET_LENGTH: usize = 0;

	fn hash(&self, secrets: &[u8], params: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		dbg!(secrets.len());
		if secrets.len() != 96 {
			return Err(OpStatusCode::InvalidNoteLength);
		}
		let leaf_res = match (self.exponentiation, self.width) {
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
		let leaf = leaf_res.into_repr().to_bytes_be();
		Ok(leaf)
	}
}

impl ArkworksPoseidonBn254NoteGenerator {
	fn get_params(&self) -> PoseidonParameters<Fr> {
		match (self.exponentiation, self.width) {
			(5, 3) => setup_params_x3_3::<Fr>(Curve::Bn254),
			(5, 5) => setup_params_x5_5::<Fr>(Curve::Bn254),
			(3, 3) => setup_params_x3_3::<Fr>(Curve::Bn254),
			(3, 5) => setup_params_x3_5::<Fr>(Curve::Bn254),
			(17, 3) => setup_params_x17_3::<Fr>(Curve::Bn254),
			(17, 5) => setup_params_x17_5::<Fr>(Curve::Bn254),
			_ => {
				unreachable!()
			}
		}
	}

	fn set_up<T: Rounds>(_: T) -> Self {
		let exponentiation = match T::SBOX {
			PoseidonSbox::Exponentiation(e) => e,
			PoseidonSbox::Inverse => {
				unreachable!()
			}
		};
		Self {
			exponentiation,
			width: T::WIDTH,
		}
	}
}

#[cfg(test)]
mod test {
	use crate::note::NoteBuilder;

	use super::*;

	#[test]
	fn arkworks_poseidon_bn254note_generator_5x_3() {
		let note_generator = ArkworksPoseidonBn254NoteGenerator::set_up(PoseidonRounds_x5_3);
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
	#[test]
	fn arkworks_poseidon_bn254note_generator_5x_5() {
		let note_generator = ArkworksPoseidonBn254NoteGenerator::set_up(PoseidonRounds_x5_5);
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
	#[test]
	fn arkworks_poseidon_bn254note_generator_3x_3() {
		let note_generator = ArkworksPoseidonBn254NoteGenerator::set_up(PoseidonRounds_x3_3);
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
	#[test]
	fn arkworks_poseidon_bn254note_generator_3x_5() {
		let note_generator = ArkworksPoseidonBn254NoteGenerator::set_up(PoseidonRounds_x3_5);
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
		dbg!(&leaf);
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
	#[test]
	fn arkworks_poseidon_bn254note_generator_17x_3() {
		let note_generator = ArkworksPoseidonBn254NoteGenerator::set_up(PoseidonRounds_x17_3);
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}

	#[test]
	fn arkworks_poseidon_bn254note_generator_17x_5() {
		let note_generator = ArkworksPoseidonBn254NoteGenerator::set_up(PoseidonRounds_x17_5);
		let secrets = note_generator.generate_secrets(&mut OsRng::default()).unwrap();
		let leaf = note_generator.hash(&secrets, note_generator.get_params()).unwrap();
		let note = note_generator
			.generate(&NoteBuilder::default(), &mut OsRng::default())
			.unwrap();
		dbg!(note.to_string());
	}
}
