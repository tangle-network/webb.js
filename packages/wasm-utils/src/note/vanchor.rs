use ark_ff::{BigInteger, PrimeField};
use arkworks_setups::common::{Leaf, VAnchorLeaf};
use arkworks_setups::r1cs::vanchor::VAnchorR1CSProver;
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{Curve as ArkCurve, VAnchorProver};
use rand::rngs::OsRng;

use crate::types::{Curve, OpStatusCode, OperationError};
use crate::{VAnchorR1CSProverBls381_30_2, VAnchorR1CSProverBn254_30_2, VAnchorR1CSProverBn254_30_2_2_2};
use crate::note::{JsUtxo, JsUtxoInner};

pub fn generate_secrets(
	amount: u128,
	exponentiation: i8,
	width: usize,
	curve: Curve,
	chain_id: u64,
	index: Option<u64>,
	rng: &mut OsRng,
) -> Result<JsUtxo, OpStatusCode> {
	let utxo:JsUtxo = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 5) => {
			VAnchorR1CSProverBn254_30_2_2_2::create_random_leaf(ArkCurve::Bls381, chain_id, amount, index, rng).map(
				|utxo| JsUtxo::new_from_bn254_UTXO(utxo)
		}
		(Curve::Bn254, 5, 5) => {
			let (blinding_bytes, ..) =
				VAnchorR1CSProverBls381_30_2::create_random_leaf(ArkCurve::Bn254, chain_id, amount, index, rng);
			blinding_bytes
		}
		_ => {
			let message = format!(
				"No VAnchor leaf setup for curve {}, exponentiation {}, and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(
				OpStatusCode::FailedToGenerateTheLeaf,
				message,
			));
		}
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::FailedToGenerateTheLeaf, e.to_string()))?;

	Ok(secrets)
}
pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	raw: &[u8],
	chain_id: u64,
	amount: u128,
	index: Option<u64>,
) -> Result<VAnchorLeaf, OperationError> {
	if raw.len() < 64 {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	let private_key = raw[..32].to_vec();
	let blinding = raw[32..64].to_vec();
	// (leaf_bytes, nullifier_hash_bytes)
	let utxo = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 3) => VAnchorR1CSProverBls381_30_2::create_leaf_with_privates(
			ArkCurve::Bls381,
			chain_id,
			amount,
			index,
			private_key,
			blinding,
		),
		(Curve::Bn254, 5, 3) => VAnchorR1CSProverBn254_30_2::create_leaf_with_privates(
			ArkCurve::Bn254,
			chain_id,
			amount,
			index,
			private_key,
			blinding,
		),
		_ => {
			let message = format!(
				"No VAnchor leaf setup for curve {}, exponentiation {}, and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(
				OpStatusCode::FailedToGenerateTheLeaf,
				message,
			));
		}
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::FailedToGenerateTheLeaf, e.to_string()))?;

	Ok(VAnchorLeaf {
		chain_id_bytes: vec![],
		amount,
		index: 0u32,
		blinding_bytes: utxo.blinding.into_repr().to_bytes_le(),
		leaf_bytes: utxo.commitment.into_repr().to_bytes_le(),
		nullifier_bytes: utxo.nullifier.unwrap().into_repr().to_bytes_le(),

		public_key_bytes: utxo.keypair.public_key().unwrap().into_repr().to_bytes_le(),
		private_key_bytes: utxo.keypair.secret_key.into_repr().to_bytes_le(),
		nullifier_hash_bytes: utxo.get_nullifier().into_repr().to_bytes_le(),
	})
}
