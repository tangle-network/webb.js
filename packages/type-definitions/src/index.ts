import { jsonrpcFromDefs, typesAliasFromDefs } from '@open-web3/orml-type-definitions/utils';

import mixer from './mixer';
import versioned from './types-known/versioned';

// FIXME: currently we cannot override this in runtime definations because the code generation script cannot handle overrides
// This will make it behave correctly in runtime, but wrong types in TS defination.
const additionalOverride = {
  Keys: 'SessionKeys2',
  PalletsOrigin: {
    _enum: {
      System: 'SystemOrigin',
      Timestamp: 'Null',
      RandomnessCollectiveFlip: 'Null',
      Balances: 'Null',
      Accounts: 'Null',
      Currencies: 'Null',
      Tokens: 'Null',
      Vesting: 'Null',
      AcalaTreasury: 'Null',
      Utility: 'Null',
      Multisig: 'Null',
      Recovery: 'Null',
      Proxy: 'Null',
      Scheduler: 'Null',
      Indices: 'Null',
      GraduallyUpdate: 'Null',
      Authorship: 'Null',
      Babe: 'Null',
      Grandpa: 'Null',
      Staking: 'Null',
      Session: 'Null',
      Historical: 'Null',
      GeneralCouncil: 'CollectiveOrigin',
      GeneralCouncilMembership: 'Null',
      HonzonCouncil: 'CollectiveOrigin',
      HonzonCouncilMembership: 'Null',
      HomaCouncil: 'CollectiveOrigin',
      HomaCouncilMembership: 'Null',
      TechnicalCommittee: 'CollectiveOrigin',
      TechnicalCommitteeMembership: 'Null',
      Authority: 'DelayedOrigin',
      ElectionsPhragmen: 'Null',
      AcalaOracle: 'Null',
      BandOracle: 'Null',
      OperatorMembershipAcala: 'Null',
      OperatorMembershipBand: 'Null',
      Auction: 'Null',
      Rewards: 'Null',
      OrmlNFT: 'Null',
      Prices: 'Null',
      Dex: 'Null',
      AuctionManager: 'Null',
      Loans: 'Null',
      Honzon: 'Null',
      CdpTreasury: 'Null',
      CdpEngine: 'Null',
      EmergencyShutdown: 'Null',
      Homa: 'Null',
      NomineesElection: 'Null',
      StakingPool: 'Null',
      PolkadotBridge: 'Null',
      Incentives: 'Null',
      AirDrop: 'Null',
      NFT: 'Null',
      RenVmBridge: 'Null',
      Contracts: 'Null',
      EVM: 'Null',
      Sudo: 'Null',
      TransactionPayment: 'Null'
    }
  }
};

const webbDefs = {
  mixer
};

export const types = {
  ...additionalOverride
};

export const typesBundle = {
  spec: {
    mandala: {
      types: versioned
    },
    acala: {
      types: versioned
    }
  }
};

export const rpc = jsonrpcFromDefs(webbDefs, {});
export const typesAlias = typesAliasFromDefs(webbDefs, {});

const bundle = {
  types: [...versioned].map((version) => {
    return {
      minmax: version.minmax,
      types: {
        ...types,
        ...version.types
      }
    };
  }),
  alias: typesAlias
};

// Type overrides have priority issues
export const typesBundleForPolkadot = {
  spec: {
    acala: bundle,
    mandala: bundle
  }
};
