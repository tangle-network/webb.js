use ark_ff::{BigInteger, PrimeField};
use arkworks_setups::common::{Leaf, VAnchorLeaf};
use arkworks_setups::r1cs::vanchor::VAnchorR1CSProver;
use arkworks_setups::utxo::Utxo;
use arkworks_setups::{Curve as ArkCurve, VAnchorProver};
use rand::rngs::OsRng;

use crate::types::{Curve, OpStatusCode, OperationError};
use crate::utxo::{JsUtxo, JsUtxoInner};
use crate::VAnchorR1CSProverBn254_30_2_2_2;

pub fn generate_secrets(
	amount: u128,
	exponentiation: i8,
	width: usize,
	curve: Curve,
	chain_id: u64,
	index: Option<u64>,
	rng: &mut OsRng,
) -> Result<JsUtxo, OperationError> {
	let utxo: JsUtxo = match (curve, exponentiation, width) {
		(Curve::Bn254, 5, 5) => {
			VAnchorR1CSProverBn254_30_2_2_2::create_random_leaf(ArkCurve::Bn254, chain_id, amount, index, rng)
				.map(|utxo| JsUtxo::new_from_bn254_utxo(utxo))
		}
		_ => {
			let message = format!(
				"No VAnchor leaf setup for curve {}, exponentiation {}, and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(OpStatusCode::SecretGenFailed, message));
		}
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::SecretGenFailed, e.to_string()))?;

	Ok(utxo)
}

pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	private_key: &[u8],
	blinding: &[u8],
	chain_id: u64,
	amount: u128,
	index: Option<u64>,
) -> Result<JsUtxo, OperationError> {
	let utxo: JsUtxo = match (curve, exponentiation, width) {
		(Curve::Bn254, 5, 3) => VAnchorR1CSProverBn254_30_2_2_2::create_leaf_with_privates(
			ArkCurve::Bn254,
			chain_id,
			amount,
			index,
			private_key.to_vec(),
			blinding.to_vec(),
		)
		.map(|utxo| JsUtxo::new_from_bn254_utxo(utxo)),
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

	Ok(utxo)
}
