use crate::types::Curve;
use ark_crypto_primitives::CRH;
use ark_ff::PrimeField;
use arkworks_gadgets::ark_std::rand;
use arkworks_gadgets::ark_std::rand::distributions::{Distribution, Standard};
use arkworks_gadgets::ark_std::rand::rngs::StdRng;
use arkworks_gadgets::ark_std::rand::{Rng, SeedableRng};
use arkworks_gadgets::prelude::ark_bls12_381::{Bls12_381, Fr as FrBls381};
use arkworks_gadgets::prelude::ark_bn254::{Bn254, Fr as FrBn254};
use arkworks_gadgets::prelude::ark_groth16::Proof;
use arkworks_gadgets::setup::common::{
	setup_params_x5_3, setup_params_x5_5, setup_tree_and_create_path_x5, Curve as ArkCurve,
};
use arkworks_gadgets::setup::mixer::{
	get_public_inputs, prove_groth16_x5, setup_arbitrary_data, setup_leaf_x5, setup_random_groth16_x5, Circuit_x5,
};

pub fn test_rng() -> StdRng {
	// arbitrary seed
	let seed = [
		1, 0, 0, 0, 23, 0, 0, 0, 200, 1, 0, 0, 210, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	];
	rand::rngs::StdRng::from_seed(seed)
}

pub struct ZkProof {
	curve: Curve,
	recipient: String,
	relayer: String,
	leaves: Vec<[u8; 32]>,
}
const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";

impl ZkProof {
	pub fn generate_proof(&self) -> Proof<Bls12_381> {
		let mut rng = test_rng();

		let recipient = FrBls381::from_be_bytes_mod_order(self.recipient.as_bytes());
		let relayer = FrBls381::from_be_bytes_mod_order(self.relayer.as_bytes());
		let params5 = setup_params_x5_5::<FrBls381>(ArkCurve::Bls381);
		let arbitrary_input = setup_arbitrary_data::<FrBls381>(recipient, relayer);
		let (leaf_private, leaf, nullifier_hash) = setup_leaf_x5::<_, FrBls381>(&params5, &mut rng);

		let mut leaves_new: Vec<FrBls381> = self
			.leaves
			.to_vec()
			.into_iter()
			.map(|leaf| PrimeField::from_be_bytes_mod_order(&leaf))
			.collect();

		let (tree, path) = setup_tree_and_create_path_x5::<FrBls381>(&leaves_new, 0, &params5);
		let root = tree.root().inner();

		let mc = Circuit_x5::<FrBls381>::new(
			arbitrary_input.clone(),
			leaf_private,
			(),
			params5,
			path,
			root.clone(),
			nullifier_hash,
		);

		// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
		let (pk, vk) = setup_random_groth16_x5::<_, Bls12_381>(&mut rng, ArkCurve::Bls381);
		prove_groth16_x5::<_, Bls12_381>(&pk, mc.clone(), &mut rng)
	}
}

#[cfg(test)]
mod test {
	use super::*;

	#[test]
	fn should_create_zkp() {
		let zkp_input = ZkProof {
			relayer: "0".to_string(),
			recipient: "0".to_string(),
			leaves: Vec::new(),
			curve: Curve::Bls381,
		};

		let proof = zkp_input.generate_proof();
	}
}
