use crate::note::note::{LeafHasher, NoteGenerator, OpStatusCode};
use bulletproofs_gadgets::poseidon::builder::Poseidon;
use bulletproofs_gadgets::poseidon::Poseidon_hash_2;
use curve25519_dalek::scalar::Scalar;
use rand::rngs::OsRng;
use rand::Rng;

pub struct PoseidonNoteGeneratorCurve25519 {
	pub hasher: Poseidon,
}

impl LeafHasher for PoseidonNoteGeneratorCurve25519 {
	type HasherOptions = ();

	const SECRET_LENGTH: usize = 128;

	fn hash(&self, input: &[u8], _: Self::HasherOptions) -> Result<Vec<u8>, OpStatusCode> {
		if input.len() != 64 {
			return Err(OpStatusCode::InvalidNoteLength);
		}
		let mut r: [u8; 32] = [0; 32];
		r.clone_from_slice(&input[..32]);
		let secret = Scalar::from_bytes_mod_order(r);
		r.clone_from_slice(&input[32..]);
		let nullifier = Scalar::from_bytes_mod_order(r);
		let leaf = Poseidon_hash_2(secret, nullifier, &self.hasher);
		let leaf_bytes = leaf.to_bytes();
		let mut leaf = Vec::new();
		leaf.extend_from_slice(&leaf_bytes);
		Ok(leaf)
	}
}

impl NoteGenerator for PoseidonNoteGeneratorCurve25519 {
	type Rng = OsRng;

	fn generate_secrets(&self, rng: &mut Self::Rng) -> Result<Vec<u8>, OpStatusCode> {
		let mut r: [u8; 32] = [0; 32];
		let mut nullifier = [0u8; 32];
		rng.fill(&mut r);
		rng.fill(&mut nullifier);
		let full = [r, nullifier].concat();
		let mut full_secret: Vec<u8> = Vec::new();
		full_secret.extend_from_slice(&full);
		Ok(full_secret)
	}
}
#[cfg(test)]
mod tests {

	use crate::PoseidonHasher;

	use crate::note::bulletproof_posidon_25519::PoseidonNoteGeneratorCurve25519;
	use crate::note::note::{NoteBuilder, NoteGenerator, PoseidonHasherOptions};
	use bulletproofs::{BulletproofGens, PedersenGens};
	use bulletproofs_gadgets::poseidon::{PoseidonBuilder, PoseidonSbox};
	use rand::rngs::OsRng;

	#[test]
	fn init_hasher() {
		let opts = PoseidonHasherOptions::default();
		let pc_gens = PedersenGens::default();
		let bp_gens = opts.bp_gens.clone().unwrap_or_else(|| BulletproofGens::new(16_400, 1));

		let poseidon_hasher = PoseidonBuilder::new(opts.width)
			.sbox(PoseidonSbox::Exponentiation3)
			.bulletproof_gens(bp_gens)
			.pedersen_gens(pc_gens)
			.build();

		let poseidon_note_generator = PoseidonNoteGeneratorCurve25519 {
			hasher: poseidon_hasher,
		};
		let mut rng = OsRng::default();
		let note = poseidon_note_generator
			.generate(&NoteBuilder::default(), &mut rng)
			.unwrap();
		println!("{:?}", note.to_string());
	}
}
