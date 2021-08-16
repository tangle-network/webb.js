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
	leaves: Vec<Vec<u8>>,
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
		dbg!(&root);

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
		let leaves = [
			"0x2e5c62af48845c095bfa9b90b8ec9f6b7bd98fb3ac2dd3039050a64b919951dd",
			"0x3007c62f678a503e568534487bc5b0bc651f37bbe1f34668b4c8a360f15ba3c3",
			"0x1ec12c8b3db99467523b352191a93e206d9193e9ca4e6162828f89f375876fba",
			"0x235c395fb58781b1e5d2659a2440e3cc4fe2ca274278bc05bcb8860d339e51bb",
			"0x2cc89541c606482ab5736115f3ca3dd5fcbe150dc50042c27b4653b9428a648f",
			"0x2f0c62e073b5ef26c44e1e590c1000b0388a234dc73f9ada563737b631cbe870",
			"0x15c5b95023b2198bad62de0d2b503af4e1febde94896440aba818849981f3145",
			"0x1181497197f03384d142fa00f88cf731185f886e69560e4ec775e531e9fdaead",
			"0x1a6599a0bf4c5dce3dd8419c968727e813e296075f7fba98c32704aa5481103a",
			"0x25f38e7d28648d602b94dd2e3cba2319212035c42a5c5cc528dbea8b34bb2203",
			"0x204da648df5d62c464bd7b4d88cd2eef4fd3866b12b69f7488c71cf61f0c3b47",
			"0x1fea40ab1d91aa5dbe2f9d5d829e53d09efc3e5b64484008f09d44058f24c071",
			"0x134ec9bdeb51bb4adb26a1ac10cbed5f3c381f897f667134657d27cf16cb291f",
			"0x2e95b88f4caa6c93c7ed1c5736a8a202bf4a24a59d8db5fdd028d88d1097bc8f",
			"0x03d5d333b260a382125e88560015f6343b48ec9791aed5af61c95e0b9cff1c77",
			"0x14d520291c9c32e698a1728138d2b1c6cb43ef4841200a4f54c9389301dd62b6",
			"0x2fce45e16df45d46f637456763b5a80f0e36240122dfa5afe74f5dae6f7e7491",
			"0x0edf79f56a49b49a204a696260c6257fddb061867ea9d0f68f915f99e9212b3a",
			"0x1b76df559c5b20d49d3f3c3c25a91d2f6fb457ca947d229f9a6f3e2f9a8ed2d5",
			"0x0f965c23dd5e2aa59a04edd418173273a55ea34c3c03568346b48f4fa84b9372",
			"0x211cc84443fcabbea8f9c5b7395fbc77de19511761413a79bb6713429c319e20",
			"0x1665fe58542013065e8aa459684ed07a2b45a96e20d698099e72b71b0a2dcd39",
			"0x263caed125777c6ead622bab9935677768f573023490e9a5da01efdb0d535ee9",
			"0x061390a981907195af69a139877a7794b0807d7f943dd093c6b23772aea6b5e7",
			"0x13d420c1c07d781c8ad7761a30aa10948f0c1445db5735a17f8b4d213a458f08",
			"0x08c2088aad0ba3b6b194567779a09efd23f039306b2a1fa177bb9495e5645b5f",
			"0x2c5ae8bbe6693a853cf617acb8997459b096f1e23990c59165d2d83ca4d5a70e",
			"0x2686cde4cc3c2718fc98a494691b1090d162d9b6e97d2094e90186e765a0dd3e",
			"0x16bac9eacf126d54956794571e279532db94b38e89fba15ff029357cbb5b252c",
			"0x18ff90d73fce2ccc8ee0133af9d44cf41fd6d5f9236267b2b3ab544ad53812c0",
			"0x1498ad993ec57cc62702bf5d03ec618fa87d408855ffc77efb6245f8f8abd4d3",
		];
		let leaves_bytes: Vec<_> = leaves.iter().map(|item| item.as_bytes().to_vec()).collect();
		dbg!(leaves_bytes[0].len());
		let zkp_input = ZkProof {
			relayer: "0x929E7eb6997408C196828773db642D76e79bda93".to_string(),
			recipient: "0x929E7eb6997408C196828773db642D76e79bda93".to_string(),
			leaves: leaves_bytes,
			curve: Curve::Bls381,
		};

		let proof = zkp_input.generate_proof();
	}
}
