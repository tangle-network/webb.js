use super::*;
use core::fmt;
use std::str::FromStr;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum NoteVersion {
	V1,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Chain {
	Edgeware,
	Ganache,
	Beresheet,
	HarmonyTestShard1,
	Rinkeby,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Backend {
	Bulletproofs,
	Arkworks,
	Circom,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Curve {
	Bls381,
	Bn254,
	Curve25519,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum HashFunction {
	Poseidon3,
	Poseidon5,
	Poseidon17,
	MiMCTornado,
}

impl fmt::Display for Backend {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Backend::Arkworks => write!(f, "Arkworks"),
			Backend::Bulletproofs => write!(f, "Bulletproofs"),
			Backend::Circom => write!(f, "Circom"),
		}
	}
}

impl FromStr for Backend {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Arkworks" => Ok(Backend::Arkworks),
			"Bulletproofs" => Ok(Backend::Bulletproofs),
			"Circom" => Ok(Backend::Circom),
			_ => Err(OpStatusCode::InvalidBackend),
		}
	}
}

impl fmt::Display for HashFunction {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			HashFunction::Poseidon3 => write!(f, "Poseidon3"),
			HashFunction::Poseidon5 => write!(f, "Poseidon5"),
			HashFunction::Poseidon17 => write!(f, "Poseidon17"),
			HashFunction::MiMCTornado => write!(f, "MiMCTornado"),
		}
	}
}

impl FromStr for HashFunction {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Poseidon3" => Ok(HashFunction::Poseidon3),
			"Poseidon5" => Ok(HashFunction::Poseidon5),
			"Poseidon17" => Ok(HashFunction::Poseidon17),
			"MiMCTornado" => Ok(HashFunction::MiMCTornado),
			_ => Err(OpStatusCode::InvalidHasFunction),
		}
	}
}

impl fmt::Display for Curve {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			Curve::Curve25519 => write!(f, "Curve25519"),
			Curve::Bls381 => write!(f, "Bls381"),
			Curve::Bn254 => write!(f, "Bn254"),
		}
	}
}

impl FromStr for Curve {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"Curve25519" => Ok(Curve::Curve25519),
			"Bls381" => Ok(Curve::Bls381),
			"Bn254" => Ok(Curve::Bn254),
			_ => Err(OpStatusCode::InvalidCurve),
		}
	}
}

impl fmt::Display for NoteVersion {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match self {
			NoteVersion::V1 => write!(f, "v1"),
		}
	}
}

impl FromStr for NoteVersion {
	type Err = OpStatusCode;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"v1" => Ok(NoteVersion::V1),
			_ => Err(OpStatusCode::InvalidNoteVersion),
		}
	}
}
