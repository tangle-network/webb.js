use ark_ff::PrimeField;
use arkworks_utils::poseidon::PoseidonParameters;
use arkworks_utils::utils::common::{setup_params_x5_3, setup_params_x5_5, Curve};

pub fn get_hash_params_x5<T: PrimeField>(curve: Curve) -> (PoseidonParameters<T>, PoseidonParameters<T>) {
	(setup_params_x5_3::<T>(curve), setup_params_x5_5::<T>(curve))
}
