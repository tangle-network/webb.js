use crate::note::Note;
use crate::proof::utils::get_hash_params_x5;
use crate::types::Curve;
use ark_ff::FromBytes;
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use arkworks_circuits::prelude::ark_groth16::ProvingKey;
use arkworks_circuits::setup::common::{
	setup_tree_and_create_path_tree_x17, setup_tree_and_create_path_tree_x5, PoseidonCRH_x17_5, PoseidonCRH_x3_3,
	PoseidonCRH_x5_5,
};
use arkworks_circuits::setup::mixer::{
	prove_groth16_circuit_x17, prove_groth16_circuit_x5, setup_arbitrary_data, setup_groth16_circuit_x17,
	setup_groth16_circuit_x5, Circuit_x17, Circuit_x5,
};
use arkworks_gadgets::ark_std::rand;
use arkworks_gadgets::leaf::mixer::{MixerLeaf, Private};
use arkworks_gadgets::prelude::ark_bls12_381::{Bls12_381, Fr as FrBls381, Fr};
use arkworks_gadgets::prelude::ark_bn254::{Bn254, Fr as FrBn254};
use arkworks_gadgets::prelude::ark_ff::{PrimeField, ToBytes};
use arkworks_gadgets::prelude::ark_groth16::Proof;
use arkworks_utils::prelude::ark_bn254;
use arkworks_utils::utils::common::{
	setup_params_x17_3, setup_params_x17_5, setup_params_x5_3, setup_params_x5_5, Curve as ArkCurve,
};

mod utils;

pub type LeafX5<F> = MixerLeaf<F, PoseidonCRH_x5_5<F>>;
pub type LeafX3<F> = MixerLeaf<F, PoseidonCRH_x3_3<F>>;
pub type LeafX17<F> = MixerLeaf<F, PoseidonCRH_x17_5<F>>;

pub fn get_rng() -> rand::rngs::OsRng {
	rand::rngs::OsRng
}
pub const LEN: usize = 30;

#[derive(Debug, Eq, PartialEq)]
pub struct ZkProofBuilder {
	recipient: Vec<u8>,
	relayer: Vec<u8>,
	leaves: Vec<[u8; 32]>,

	leaf_index: u32,
	fee: u32,
	refund: u32,
	note: Option<Note>,
	pk: Vec<u8>,
}
type PrivateFr = Private<Fr>;

const SEED: &[u8; 32] = b"WebbToolsPedersenHasherSeedBytes";
pub struct Zkp {
	proof: ZKProof,
}
pub struct ProofMeta {
	pub root: Vec<u8>,
	pub nullified_hash: Vec<u8>,
}
pub enum ZKProof {
	Bls12_381(Proof<Bls12_381>, ProofMeta),
	Bn254(Proof<Bn254>, ProofMeta),
}

impl ZKProof {
	pub fn get_bytes(&self) -> Vec<u8> {
		let mut bytes = Vec::new();
		match self {
			ZKProof::Bls12_381(proof, _) => CanonicalSerialize::serialize(proof, &mut bytes).unwrap(),
			ZKProof::Bn254(proof, _) => CanonicalSerialize::serialize(proof, &mut bytes).unwrap(),
		}
		bytes
	}

	pub fn get_meta(&self) -> ProofMeta {
		match self {
			ZKProof::Bls12_381(_, proof_meta) => ProofMeta {
				root: proof_meta.root.clone(),
				nullified_hash: proof_meta.nullified_hash.clone(),
			},
			ZKProof::Bn254(_, proof_meta) => ProofMeta {
				root: proof_meta.root.clone(),
				nullified_hash: proof_meta.nullified_hash.clone(),
			},
		}
	}

	/*	pub(crate) fn verify(&self, proof_input: &ZkProofBuilder) -> bool {
		let pk = ProvingKey::<ark_bn254::Bn254>::deserialize_unchecked(&*proof_input.pk).unwrap();
		let vk = pk.vk;
		let proof_bytes = self.get_bytes();
		let meta = self.get_meta();
		let proof = Proof::<FrBn254>::deserialize(proof_bytes).unwrap();
		let mut public_inp_bytes = Vec::new();
		let recipient_bytes = truncate_and_pad(&proof_input.recipient.using_encoded(element_encoder)[..]);
		let relayer_bytes = truncate_and_pad(&relayer.using_encoded(element_encoder)[..]);
		public_inp_bytes.extend_from_slice(&truncate_and_pad(&meta.nullified_hash));
		public_inp_bytes.extend_from_slice(&truncate_and_pad(&meta.root));
		let element_encoder = |v: &[u8]| {
			let mut output = [0u8; 32];
			output.iter_mut().zip(v).for_each(|(b1, b2)| *b1 = *b2);
			output
		};
		let public_input_field_elts = to_field_elements::<FrBn254>(public_inp_bytes).unwrap();
		let res = verify_groth16::<FrBn254>(&vk, &public_input_field_elts, &proof);

		false
	}*/

	pub(crate) fn new(proof_input: &ZkProofBuilder) -> Self {
		let mut rng = get_rng();
		let note = match &proof_input.note {
			None => {
				panic!("No note found");
			}
			Some(note) => note,
		};
		match note.curve {
			Curve::Bn254 => {
				let recipient_bytes = truncate_and_pad(&proof_input.recipient);
				let relayer_bytes = truncate_and_pad(&proof_input.relayer);
				let recipient = FrBn254::read(&recipient_bytes[..]).expect("Failed to read recipient_bytes");
				let relayer = FrBn254::read(&relayer_bytes[..]).expect("Failed to read relayer_bytes");

				let fee = FrBn254::from(proof_input.fee);
				let refund = FrBn254::from(proof_input.refund);
				// todo fix this
				match note.exponentiation.to_string().as_str() {
					"3" => {
						unimplemented!("exponentiation of 3 unsupported");
					}
					"5" => {
						let (params3, params5) = get_hash_params_x5::<FrBn254>(ArkCurve::Bn254);
						let arbitrary_input = setup_arbitrary_data::<FrBn254>(recipient, relayer, fee, refund);
						let leaves_new: Vec<FrBn254> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_le_bytes_mod_order(&leaf))
							.collect();
						let (tree, path) = setup_tree_and_create_path_tree_x5::<FrBn254, LEN>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params3,
						);
						let leaf_private: Private<FrBn254> = Private::new(
							PrimeField::from_le_bytes_mod_order(&note.secret[..32]),
							PrimeField::from_le_bytes_mod_order(&note.secret[32..64]),
						);
						let nullifier_hash = LeafX5::create_nullifier(&leaf_private, &params5).unwrap();
						let mut nh_bytes: Vec<u8> = vec![];
						nullifier_hash.write(&mut nh_bytes).unwrap();
						let root = tree.root().inner();
						let mut root_bytes: Vec<u8> = vec![];
						root.write(&mut root_bytes).unwrap();
						let mc = Circuit_x5::<FrBn254, LEN>::new(
							arbitrary_input,
							leaf_private,
							params5,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let pk = ProvingKey::<ark_bn254::Bn254>::deserialize_unchecked(&*proof_input.pk).unwrap();
						let proof = prove_groth16_circuit_x5::<_, Bn254, LEN>(&pk, mc, &mut rng);
						Self::Bn254(proof, ProofMeta {
							nullified_hash: nh_bytes,
							root: root_bytes,
						})
					}
					"17" => {
						let params17 = match note.width.to_string().as_str() {
							"5" => setup_params_x17_5::<FrBn254>(ArkCurve::Bn254),
							"3" => setup_params_x17_3::<FrBn254>(ArkCurve::Bn254),
							_ => {
								unreachable!("exponentiation 17 unsupported")
							}
						};
						let arbitrary_input = setup_arbitrary_data::<FrBn254>(recipient, relayer, fee, refund);
						let leaves_new: Vec<FrBn254> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_le_bytes_mod_order(&leaf))
							.collect();
						let (tree, path) = setup_tree_and_create_path_tree_x17::<FrBn254, LEN>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params17,
						);
						let leaf_private: Private<FrBn254> = Private::new(
							PrimeField::from_le_bytes_mod_order(&note.secret[..32]),
							PrimeField::from_le_bytes_mod_order(&note.secret[32..64]),
						);
						let nullifier_hash = LeafX17::create_nullifier(&leaf_private, &params17).unwrap();

						let mut nh_bytes: Vec<u8> = vec![];
						nullifier_hash.write(&mut nh_bytes).unwrap();
						let root = tree.root().inner();
						let mut root_bytes: Vec<u8> = vec![];
						root.write(&mut root_bytes).unwrap();

						let mc = Circuit_x17::<FrBn254, LEN>::new(
							arbitrary_input,
							leaf_private,
							params17,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _vk) = setup_groth16_circuit_x17::<_, Bn254, LEN>(&mut rng, mc.clone());
						let proof = prove_groth16_circuit_x17::<_, Bn254, LEN>(&pk, mc, &mut rng);
						Self::Bn254(proof, ProofMeta {
							root: root_bytes,
							nullified_hash: nh_bytes,
						})
					}
					e => {
						unreachable!("exponentiation {} unsupported", e)
					}
				}
			}
			Curve::Bls381 => {
				let recipient_bytes = truncate_and_pad(&proof_input.recipient);
				let relayer_bytes = truncate_and_pad(&proof_input.relayer);
				let recipient = FrBls381::read(&recipient_bytes[..]).unwrap();
				let relayer = FrBls381::read(&relayer_bytes[..]).unwrap();
				let fee = FrBls381::from(proof_input.fee);
				let refund = FrBls381::from(proof_input.refund);

				match note.exponentiation.to_string().as_str() {
					"3" => {
						unimplemented!("unsupported exponentiation 3");
					}
					"5" => {
						// Setup Params
						//setup_circom_params_x5_3
						let params5 = match note.width.to_string().as_str() {
							"5" => setup_params_x5_5::<FrBls381>(ArkCurve::Bls381),
							"3" => setup_params_x5_3::<FrBls381>(ArkCurve::Bls381),
							w => {
								unimplemented!("width of {} unsupported", w);
							}
						};
						// Setup Arbitrary iput
						let arbitrary_input = setup_arbitrary_data::<FrBls381>(recipient, relayer, fee, refund);
						// getting `PrimeField` of leaves
						let leaves_new: Vec<FrBls381> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_le_bytes_mod_order(&leaf))
							.collect();
						//setup tree with the leaves and parameters to get the path
						let (tree, path) = setup_tree_and_create_path_tree_x5::<FrBls381, LEN>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params5,
						);

						let leaf_private: Private<FrBls381> = Private::new(
							PrimeField::from_le_bytes_mod_order(&note.secret[..32]),
							PrimeField::from_le_bytes_mod_order(&note.secret[32..64]),
						);
						let nullifier_hash = LeafX5::create_nullifier(&leaf_private, &params5).unwrap();

						let mut nh_bytes: Vec<u8> = vec![];
						nullifier_hash.write(&mut nh_bytes).unwrap();
						let root = tree.root().inner();
						let mut root_bytes: Vec<u8> = vec![];
						root.write(&mut root_bytes).unwrap();

						let mc = Circuit_x5::<FrBls381, LEN>::new(
							arbitrary_input,
							leaf_private,
							params5,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _vk) = setup_groth16_circuit_x5::<_, Bls12_381, LEN>(&mut rng, mc.clone());
						let proof = prove_groth16_circuit_x5::<_, Bls12_381, LEN>(&pk, mc, &mut rng);
						Self::Bls12_381(proof, ProofMeta {
							root: root_bytes,
							nullified_hash: nh_bytes,
						})
					}
					"17" => {
						let params17 = match note.width.to_string().as_str() {
							"5" => setup_params_x17_5::<FrBls381>(ArkCurve::Bls381),
							"3" => setup_params_x17_3::<FrBls381>(ArkCurve::Bls381),
							_ => {
								unreachable!("exponentiation of 3 unsupported");
							}
						};
						let arbitrary_input = setup_arbitrary_data::<FrBls381>(recipient, relayer, fee, refund);
						let leaves_new: Vec<FrBls381> = proof_input
							.leaves
							.to_vec()
							.into_iter()
							.map(|leaf| PrimeField::from_le_bytes_mod_order(&leaf))
							.collect();
						let (tree, path) = setup_tree_and_create_path_tree_x17::<FrBls381, LEN>(
							&leaves_new,
							proof_input.leaf_index as u64,
							&params17,
						);

						let leaf_private: Private<FrBls381> = Private::new(
							PrimeField::from_le_bytes_mod_order(&note.secret[..32]),
							PrimeField::from_le_bytes_mod_order(&note.secret[32..64]),
						);

						let nullifier_hash = LeafX17::create_nullifier(&leaf_private, &params17).unwrap();

						let mut nh_bytes: Vec<u8> = vec![];
						nullifier_hash.write(&mut nh_bytes).unwrap();
						let root = tree.root().inner();
						let mut root_bytes: Vec<u8> = vec![];
						root.write(&mut root_bytes).unwrap();

						let mc = Circuit_x17::<FrBls381, LEN>::new(
							arbitrary_input,
							leaf_private,
							params17,
							path,
							root,
							nullifier_hash,
						);

						// let (pk, vk) = setup_circuit_groth16(&mut rng, circuit.clone());
						let (pk, _vk) = setup_groth16_circuit_x17::<_, Bls12_381, LEN>(&mut rng, mc.clone());
						let proof = prove_groth16_circuit_x17::<_, Bls12_381, LEN>(&pk, mc, &mut rng);
						Self::Bls12_381(proof, ProofMeta {
							root: root_bytes,
							nullified_hash: nh_bytes,
						})
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
			pk: vec![],
		}
	}
}
pub fn truncate_and_pad(t: &[u8]) -> Vec<u8> {
	let mut truncated_bytes = t[..20].to_vec();
	truncated_bytes.extend_from_slice(&[0u8; 12]);
	truncated_bytes
}
// 2^254 vs 2^256
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

	pub fn set_proving_key(&mut self, pk_bytes: &[u8]) {
		self.pk = pk_bytes.to_vec()
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
	fn create_valid_root() {
		use arkworks_gadgets::prelude::ark_bn254::{Bn254, Fr as FrBn254};
		use arkworks_utils::utils::common::{setup_params_x5_3, Curve as ArkCurve};

		use ark_serialize::CanonicalSerialize;
		use arkworks_circuits::setup::common::setup_tree_and_create_path_tree_x5;
		let params = setup_params_x5_3::<FrBn254>(ArkCurve::Bn254);
		// root on the node
		let root_hex = "7b23a2906223c7a9d6948754ae0a40b8048c4faad4b989ea25428826a5899e2e";
		let leaves: Vec<FrBn254> = ["de1983b0d54b3a003ba58bf878e244112e5f373e9768a0a7a940ec7df5e37d03"]
			.to_vec()
			.into_iter()
			.map(|i| hex::decode(i).unwrap())
			.map(|leaf| FrBn254::from_le_bytes_mod_order(&leaf))
			.collect();
		let (tree, path) = setup_tree_and_create_path_tree_x5::<FrBn254, LEN>(&leaves, 0 as u64, &params);
		let root = tree.root().inner();
		let mut root_bytes = Vec::new();
		CanonicalSerialize::serialize(&root, &mut root_bytes);
		assert_eq!(hex::encode(&root_bytes), root_hex);
	}

	#[test]
	fn should_create_zkp() {
		let leaves = [
			"0x1111111000000000000000000000000000000000000000000000000000000000",
			"0x1111111000000000000000000000000000000000000000000000000000000100",
			"0x37b7c0b04e6d08f43be1dc6a4080afca5c44c251df473e336fd9f788844b861e",
			"0x6d9c60a2a9e2b101f86e66382e6b23aec8eb568ec109ba2da985ab433151cd11",
			"0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000000",
			"0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000000",
			"0x661fee59878756175f4c2af109f81cebeda980c1464e981becd19d3d99fab018",
			"0x3bdae75dd81ae9869efa7fb2bc99cdb2320d60d26b7a3591f2d8f13b9b148d1e",
			"0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000100",
			"0xf0b0797286ca58ff1217ce18993440811ac00000000000000000000000000100",
			"0x149ae0c63caebd66f3d28a7f4bf3c5f22da56c2b6a37648561141ecb7c2abf15",
			"0x6fa96ad4629490bd126da30c1df65ad37256afaaa0d9fd1856d8c755f377940e",
			"0x30c9533af24d0feb8c44bdaece49e79886720d3d43c10a8b1b14ac9071c8391d",
			"0x12dba9517079c0a79fcbdfbf77df8744f4edddf103f72f33787ef19cedf67222",
			"0x573e3cd36487821cc29d6481e5e7465902d086d11ab95a182834dbb91e93c110",
		];

		let note  =  "webb.mix:v1:1:1:Arkworks:Bn254:Poseidon:WEBB:18:1:5:3:b508e1099601315c779e3ae9a6f3dededff747ae92b41ebb3841f7a40e97b9182ae2d629b765e689503730525cb0747fd428203119166e7e7788f7b1d2b8ed21";

		let leaves_bytes: Vec<[u8; 32]> = leaves
			.iter()
			.map(|item| hex::decode(item.replace("0x", "")).unwrap().try_into().unwrap())
			.collect();
		let relayer =
			hex::decode("644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129".replace("0x", "")).unwrap();
		let recipient =
			hex::decode("644277e80e74baf70c59aeaa038b9e95b400377d1fd09c87a6f8071bce185129".replace("0x", "")).unwrap();
		let vk_bytes = include_bytes!("../../../../fixtures/verifying_key.bin");
		let mut zkp_builder = ZkProofBuilder::new();
		let mut proof_builder = ZkProofBuilder::new();
		proof_builder.set_leaves(&leaves_bytes);
		proof_builder.set_relayer(&relayer);
		proof_builder.set_recipient(&recipient);
		proof_builder.set_fee(0);
		proof_builder.set_fee(0);
		proof_builder.set_proving_key(vk_bytes);
		let note = Note::deserialize(note).unwrap();
		proof_builder.set_leaf_index(40);
		proof_builder.set_note(note);

		let proof = proof_builder.build();

		let mut proof_bytes = Vec::new();
		match proof {
			ZKProof::Bls12_381(proof, _) => {
				proof.write(&mut proof_bytes);
			}
			ZKProof::Bn254(proof, _) => {
				proof.write(&mut proof_bytes);
			}
		}
		dbg!(proof_bytes);
	}
}
