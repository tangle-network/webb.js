use ark_std::rand::rngs::OsRng;
use arkworks_setups::common::Leaf;

use crate::MixerR1CSProverBn254_30;
use crate::MixerR1CSProverBls381_30;
use arkworks_setups::MixerProver;
use arkworks_setups::Curve as ArkCurve;

use crate::types::{Curve, OpStatusCode, OperationError};

pub fn generate_secrets(
	exponentiation: i8,
	width: usize,
	curve: Curve,
	rng: &mut OsRng,
) -> Result<[Vec<u8>; 2], OperationError> {
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 3) => MixerR1CSProverBls381_30::create_random_leaf(ArkCurve::Bls381, rng),
		(Curve::Bn254, 5, 3) => MixerR1CSProverBn254_30::create_random_leaf(ArkCurve::Bn254, rng),
		_ => {
			let message = format!(
				"No Mixer secrets setup available for curve {}, exponentiation {} , and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(OpStatusCode::SecretGenFailed, message));
		}
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::SecretGenFailed, e.to_string()))?;

	let secrets = [sec.secret_bytes, sec.nullifier_bytes];

	Ok(secrets)
}

pub fn get_leaf_with_private_raw(
	curve: Curve,
	width: usize,
	exponentiation: i8,
	raw: &[u8],
) -> Result<Leaf, OperationError> {
	if raw.len() < 64 {
		return Err(OpStatusCode::InvalidNoteSecrets.into());
	}

	let secrets = raw[..32].to_vec();
	let nullifer = raw[32..64].to_vec();
	// (leaf_bytes, nullifier_hash_bytes)
	let sec = match (curve, exponentiation, width) {
		(Curve::Bls381, 5, 3) => MixerR1CSProverBls381_30::create_leaf_with_privates(ArkCurve::Bls381, secrets, nullifer),
		(Curve::Bn254, 5, 3) => MixerR1CSProverBn254_30::create_leaf_with_privates(ArkCurve::Bn254, secrets, nullifer),
		_ => {
			let message = format!(
				"No Mixer leaf setup for curve {}, exponentiation {} , and width {}",
				curve, exponentiation, width
			);
			return Err(OperationError::new_with_message(
				OpStatusCode::FailedToGenerateTheLeaf,
				message,
			));
		}
	}
	.map_err(|e| OperationError::new_with_message(OpStatusCode::FailedToGenerateTheLeaf, e.to_string()))?;
	Ok(sec)
}

#[cfg(test)]
mod test {}
