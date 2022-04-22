import { computeChainIdType, EVMChainId, SubstrateChainId, SubstrateDevelopChainId, ChainType } from "@webb-tools/api-providers/src/index.js";

// Compute the chainIdType for all evm
Object.values(EVMChainId).map((chainId) => {
  const value = computeChainIdType(ChainType.EVM, Number(chainId));

  console.log(`chainIdType calculated value for ${chainId}: ${value}`)
});

console.log('---------');

Object.values(SubstrateChainId).map((chainId) => {
  const value = computeChainIdType(ChainType.Substrate, Number(chainId));

  console.log(`chainIdType calculated value for ${chainId}: ${value}`)
});

console.log('---------');

Object.values(SubstrateDevelopChainId).map((chainId) => {
  const value = computeChainIdType(ChainType.SubstrateDevelopment, Number(chainId));

  console.log(`chainIdType calculated value for ${chainId}: ${value}`)
});

console.log('---------');
