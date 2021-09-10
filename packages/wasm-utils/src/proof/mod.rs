use ark_ff::PrimeField;
use arkworks_gadgets::ark_std::rand;
use arkworks_gadgets::ark_std::rand::rngs::StdRng;
use arkworks_gadgets::ark_std::rand::SeedableRng;
use arkworks_gadgets::leaf::mixer::{Private, PrivateBuilder};
use arkworks_gadgets::leaf::LeafCreation;
use arkworks_gadgets::prelude::ark_bls12_381::{Bls12_381, Fr as FrBls381, Fr};
use arkworks_gadgets::prelude::ark_bn254::{Bn254, Fr as FrBn254};
use arkworks_gadgets::prelude::ark_groth16::Proof;
use arkworks_gadgets::setup::common::{
	setup_params_x17_3, setup_params_x17_5, setup_params_x3_3, setup_params_x5_3, setup_params_x5_5,
	setup_tree_and_create_path_x17, setup_tree_and_create_path_x5, Curve as ArkCurve,
};
use arkworks_gadgets::setup::mixer::{
	prove_groth16_x17, prove_groth16_x5, setup_arbitrary_data, setup_random_groth16_x17, setup_random_groth16_x5,
	Circuit_x17, Circuit_x5, Leaf_x17, Leaf_x5,
};

use crate::note::Note;
use crate::types::Curve;

pub fn get_rng() -> StdRng {
	// arbitrary seed
	let seed = [
		1, 0, 0, 0, 23, 0, 0, 0, 200, 1, 0, 0, 210, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	];
	rand::rngs::StdRng::from_seed(seed)
}

#[derive(Debug, Eq, PartialEq)]
pub struct ZkProofBuilder {
	recipient: Vec<u8>,
	relayer: Vec<u8>,
	leaves: Vec<[u8; 32]>,

	leaf_index: u32,
	fee: u32,
	refund: u32,
	note: Option<Note>,
}
type PrivateFr = Private<Fr>;

const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
pub struct Zkp {
	proof: ZKProof,
}

pub enum ZKProof {
	Bls12_381(Proof<Bls12_381>),
	Bn254(Proof<Bn254>),
}

impl ZKProof {
	pub(crate) fn new(proof_input: &ZkProofBuilder) -> Self {
		let mut rng = get_rng();
		let note = match &proof_input.note {
			None => {
				panic!();
			}
			Some(note) => note,
		};
		match note.curve {
			Curve::Bn254 => {
				let recipient = FrBn254::from_be_bytes_mod_order(&proof_input.recipient);
				let relayer = FrBn254::from_be_bytes_mod_order(&proof_input.relayer);

				let fee = FrBn254::from_be_bytes_mod_order(&proof_input.fee.to_be_bytes());
				let refund = FrBn254::from_be_bytes_mod_order(&proof_input.refund.to_be_bytes());
				// todo fix this
				match note.exponentiation.as_str() {
					"3" => {
						unimplemented!();
					}
					"5" => {
						let params5 = match note.width.as_str() {
							"5" => setup_params_x5_5::<FrBn254>(ArkCurve::Bn254),
							"3" => setup_params_x3_3::<FrBn254>(ArkCurve::Bn254),
							_ => {
								unreachable!()
							}
						};
						let arbitrary_input = setup_arbitrary_data::<FrBn254>(recipient, relayer, fee, refund);
						let leaves_new: Vec<FrBn254> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_be_bytes_mod_order(&leaf))
							.collect();
						let (tree, path) = setup_tree_and_create_path_x5::<FrBn254>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params5,
						);
						let private: PrivateBuilder<FrBn254> = PrivateBuilder {
							r: PrimeField::from_be_bytes_mod_order(&note.secret[..32]),
							nullifier: PrimeField::from_be_bytes_mod_order(&note.secret[32..64]),
							rho: PrimeField::from_be_bytes_mod_order(&note.secret[64..]),
						};
						let leaf_private = private.build();
						let nullifier_hash = Leaf_x5::create_nullifier(&leaf_private, &params5).unwrap();
						let root = tree.root().inner();
						let mc = Circuit_x5::<FrBn254>::new(
							arbitrary_input,
							leaf_private,
							(),
							params5,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _) = setup_random_groth16_x5::<_, Bn254>(&mut rng, ArkCurve::Bn254);
						let proof = prove_groth16_x5::<_, Bn254>(&pk, mc, &mut rng);
						Self::Bn254(proof)
					}
					"17" => {
						let params17 = match note.width.as_str() {
							"5" => setup_params_x17_5::<FrBn254>(ArkCurve::Bn254),
							"3" => setup_params_x17_3::<FrBn254>(ArkCurve::Bn254),
							_ => {
								unreachable!()
							}
						};
						let arbitrary_input = setup_arbitrary_data::<FrBn254>(recipient, relayer, fee, refund);
						let leaves_new: Vec<FrBn254> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_be_bytes_mod_order(&leaf))
							.collect();
						let (tree, path) = setup_tree_and_create_path_x17::<FrBn254>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params17,
						);
						let private: PrivateBuilder<FrBn254> = PrivateBuilder {
							r: PrimeField::from_be_bytes_mod_order(&note.secret[..32]),
							nullifier: PrimeField::from_be_bytes_mod_order(&note.secret[32..64]),
							rho: PrimeField::from_be_bytes_mod_order(&note.secret[64..]),
						};
						let leaf_private = private.build();
						let nullifier_hash = Leaf_x17::create_nullifier(&leaf_private, &params17).unwrap();
						let root = tree.root().inner();
						let mc = Circuit_x17::<FrBn254>::new(
							arbitrary_input,
							leaf_private,
							(),
							params17,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _vk) = setup_random_groth16_x5::<_, Bn254>(&mut rng, ArkCurve::Bn254);
						let proof = prove_groth16_x17::<_, Bn254>(&pk, mc, &mut rng);
						Self::Bn254(proof)
					}
					_ => {
						unreachable!()
					}
				}
			}
			Curve::Bls381 => {
				let recipient = FrBls381::from_be_bytes_mod_order(&proof_input.recipient);
				let relayer = FrBls381::from_be_bytes_mod_order(&proof_input.relayer);
				let fee = FrBls381::from_be_bytes_mod_order(&proof_input.fee.to_be_bytes());
				let refund = FrBls381::from_be_bytes_mod_order(&proof_input.refund.to_be_bytes());

				match note.exponentiation.as_str() {
					"3" => {
						unimplemented!();
					}
					"5" => {
						// Setup Params
						let params5 = match note.width.as_str() {
							"5" => setup_params_x5_5::<FrBls381>(ArkCurve::Bls381),
							"3" => setup_params_x5_3::<FrBls381>(ArkCurve::Bls381),
							_ => {
								unreachable!();
							}
						};
						// Setup Arbitrary iput
						let arbitrary_input = setup_arbitrary_data::<FrBls381>(recipient, relayer, fee, refund);
						// getting `PrimeField` of leaves
						let leaves_new: Vec<FrBls381> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_be_bytes_mod_order(&leaf))
							.collect();
						//setup tree with the leaves and parameters to get the path
						let (tree, path) = setup_tree_and_create_path_x5::<FrBls381>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params5,
						);
						let root = tree.root().inner();
						let private: PrivateBuilder<FrBls381> = PrivateBuilder {
							r: PrimeField::from_be_bytes_mod_order(&note.secret[..32]),
							nullifier: PrimeField::from_be_bytes_mod_order(&note.secret[32..64]),
							rho: PrimeField::from_be_bytes_mod_order(&note.secret[64..]),
						};
						let leaf_private = private.build();
						let nullifier_hash = Leaf_x5::create_nullifier(&leaf_private, &params5).unwrap();

						let mc = Circuit_x5::<FrBls381>::new(
							arbitrary_input,
							leaf_private,
							(),
							params5,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _vk) = setup_random_groth16_x5::<_, Bls12_381>(&mut rng, ArkCurve::Bls381);
						let proof = prove_groth16_x5::<_, Bls12_381>(&pk, mc, &mut rng);
						Self::Bls12_381(proof)
					}
					"17" => {
						let params17 = match note.width.as_str() {
							"5" => setup_params_x17_5::<FrBls381>(ArkCurve::Bls381),
							"3" => setup_params_x17_3::<FrBls381>(ArkCurve::Bls381),
							_ => {
								unreachable!();
							}
						};
						let arbitrary_input = setup_arbitrary_data::<FrBls381>(recipient, relayer, fee, refund);
						let leaves_new: Vec<FrBls381> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_be_bytes_mod_order(&leaf))
							.collect();
						let (tree, path) = setup_tree_and_create_path_x17::<FrBls381>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params17,
						);
						let root = tree.root().inner();

						let private: PrivateBuilder<FrBls381> = PrivateBuilder {
							r: PrimeField::from_be_bytes_mod_order(&note.secret[..32]),
							nullifier: PrimeField::from_be_bytes_mod_order(&note.secret[32..64]),
							rho: PrimeField::from_be_bytes_mod_order(&note.secret[64..]),
						};

						let leaf_private = private.build();
						let nullifier_hash = Leaf_x17::create_nullifier(&leaf_private, &params17).unwrap();
						let mc = Circuit_x17::<FrBls381>::new(
							arbitrary_input,
							leaf_private,
							(),
							params17,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _vk) = setup_random_groth16_x17::<_, Bls12_381>(&mut rng, ArkCurve::Bls381);
						let proof = prove_groth16_x17::<_, Bls12_381>(&pk, mc, &mut rng);
						Self::Bls12_381(proof)
					}
					_ => {
						unreachable!()
					}
				}
			}
			Curve::Curve25519 => {
				// using bullet proof
				unimplemented!();
			}
		}
	}
}

impl Default for ZkProofBuilder {
	fn default() -> Self {
		Self {
			relayer: Vec::new(),
			recipient: Vec::new(),
			leaves: Vec::new(),
			note: None,
			fee: 0,
			refund: 0,
			leaf_index: 0,
		}
	}
}
impl ZkProofBuilder {
	pub fn new() -> Self {
		Self::default()
	}

	pub fn set_leaves(&mut self, leaves: &[[u8; 32]]) {
		self.leaves = leaves.to_vec();
	}

	pub fn push_leaf(&mut self, leaf: [u8; 32]) {
		self.leaves.push(leaf);
	}

	pub fn set_relayer(&mut self, relayer: &[u8]) {
		self.relayer = relayer.to_vec();
	}

	pub fn set_recipient(&mut self, recipient: &[u8]) {
		self.recipient = recipient.to_vec();
	}

	pub fn set_note(&mut self, note: Note) {
		self.note = Some(note);
	}

	pub fn set_fee(&mut self, fee: u32) {
		self.fee = fee;
	}

	pub fn set_leaf_index(&mut self, leaf_index: u32) {
		self.leaf_index = leaf_index;
	}

	pub fn set_refund(&mut self, refund: u32) {
		self.refund = refund;
	}

	pub fn build(&self) -> ZKProof {
		ZKProof::new(self)
	}
}

#[cfg(test)]
mod test {
	use std::convert::TryInto;

	use ark_ff::ToBytes;
	use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};

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
			"0x077c98195221f48536c2fddaa5ba6c055fa44766323058a1428f2bd6b87e7ca8",
			"0x0aef6d7f2f3de51e2c1c5d2650d09173079cff32ef69258948719c1f12f36655",
			"0x08206f9f6cf282fd9e63b0f6a30cbace3e2516254ed80102a21b540da6c93e09",
			"0x111e01dbd40d63a05513225b22c4f44c2b6e9cd2eec326fee9a2567935e1b231",
			"0x280e0ed146d74164467513bb32bce545aa85af73b183cf94d97bbce669093020",
			"0x13354539bb66a9319688498071c9e2f21c68381185a7b78320182ae3531effe0",
			"0x1b501b67b5770443b07229d18e0f1d06f2f2a663079b5f498dae56a2bcfb8004",
			"0x229cf5e35735f033bdc0b2ebce475836358146fc52b34057a1d5d663c80ce64d",
			"0x229cf5e35735f033bdc0b2ebce475836358146fc52b34057a1d5d663c80ce64d",
		];

		let note  =  "webb.mix:v1:any:Arkworks:Bn254:Poseidon:EDG:18:0:5:5:7e0f4bfa263d8b93854772c94851c04b3a9aba38ab808a8d081f6f5be9758110b7147c395ee9bf495734e4703b1f622009c81712520de0bbd5e7a10237c7d829bf6bd6d0729cca778ed9b6fb172bbb12b01927258aca7e0a66fd5691548f8717";

		let leaves_bytes: Vec<[u8; 32]> = leaves
			.iter()
			.map(|item| hex::decode(item.replace("0x", "")).unwrap().try_into().unwrap())
			.collect();
		let relayer = hex::decode("929E7eb6997408C196828773db642D76e79bda93".replace("0x", "")).unwrap();
		let recipient = hex::decode("929E7eb6997408C196828773db642D76e79bda93".replace("0x", "")).unwrap();
		let mut proof_builder = ZkProofBuilder::new();
		proof_builder.set_leaves(&leaves_bytes);
		proof_builder.set_relayer(&relayer);
		proof_builder.set_recipient(&recipient);
		let note = Note::deserialize(note).unwrap();
		proof_builder.set_leaf_index(40);
		proof_builder.set_note(note);

		let proof = proof_builder.build();

		let mut proof_bytes = Vec::new();
		match proof {
			ZKProof::Bls12_381(proof) => {
				proof.write(&mut proof_bytes);
			}
			ZKProof::Bn254(proof) => {
				proof.write(&mut proof_bytes);
			}
		}
		dbg!(proof_bytes);
	}
}
