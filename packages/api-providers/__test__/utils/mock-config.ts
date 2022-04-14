// Copyright 2022 @webb-tools/
// SPDX-License-Identifier: Apache-2.0

import { ChainType, EVMChainId, InternalChainId, SubstrateChainId } from '@webb-tools/api-providers/chains/index.js';
import { ZERO, zeroAddress } from '@webb-tools/api-providers/contracts/index.js';
import { WebbCurrencyId } from '@webb-tools/api-providers/enums/index.js';
import { AppConfig } from '@webb-tools/api-providers/index.js';
import { CurrencyRole, CurrencyType } from '@webb-tools/api-providers/types/currency-config.interface.js';

const anchorsConfig: AppConfig['anchors'] = {
  [WebbCurrencyId.webbWETH]: [
    {
      amount: '0.1',
      anchorAddresses: {
        [InternalChainId.Ropsten]: '0x97747a4De7302Ff7Ee3334e33138879469BFEcf8',
        [InternalChainId.Rinkeby]: '0x09B722aA809A076027FA51902e431a8C03e3f8dF',
        [InternalChainId.Goerli]: '0x6aA5C74953F7Da1556a298C5e129E417410474E2',
        [InternalChainId.PolygonTestnet]: '0x12323BcABB342096669d80F968f7a31bdB29d4C4',
        [InternalChainId.OptimismTestnet]: '0xC44A4EcAC4f23b6F92485Cb1c90dBEd75a987BC8',
        [InternalChainId.ArbitrumTestnet]: '0xD8a8F9629a98EABFF31CfA9493f274A4D5e768Cd'
      },
      anchorTreeIds: {}
    }
  ],
  [WebbCurrencyId.WEBB]: [
    {
      amount: '10',
      anchorAddresses: {},
      anchorTreeIds: {
        [InternalChainId.WebbDevelopment]: '3'
      }
    },
    {
      amount: '100',
      anchorAddresses: {},
      anchorTreeIds: {
        [InternalChainId.WebbDevelopment]: '4'
      }
    },
    {
      amount: '1000',
      anchorAddresses: {},
      anchorTreeIds: {
        [InternalChainId.WebbDevelopment]: '5'
      }
    }
  ],
  [WebbCurrencyId.webbDEV]: [
    {
      amount: '1',
      anchorAddresses: {
        [InternalChainId.HermesLocalnet]: '0x510C6297cC30A058F41eb4AF1BFC9953EaD8b577',
        [InternalChainId.AthenaLocalnet]: '0x7758F98C1c487E5653795470eEab6C4698bE541b'
      },
      anchorTreeIds: {}
    }
  ]
};
const chainsConfig: AppConfig['chains'] = {
  [InternalChainId.WebbDevelopment]: {
    chainId: SubstrateChainId.WebbDevelopment,
    chainType: ChainType.Substrate,
    currencies: [WebbCurrencyId.WEBB],
    group: 'webb',
    id: InternalChainId.WebbDevelopment,
    logo: undefined,
    name: 'Webb Development',
    nativeCurrencyId: WebbCurrencyId.WEBB,
    tag: 'dev',
    url: 'ws://127.0.0.1:9944'
  },
  // this is the EVM edgeware
  [InternalChainId.EdgewareTestNet]: {
    chainId: EVMChainId.Beresheet,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.TEDG],
    evmRpcUrls: ['https://beresheet.edgewa.re/evm'],
    group: 'edgeware',
    id: InternalChainId.EdgewareTestNet,
    logo: undefined,
    name: 'Beresheet (Edgeware Testnet)',
    nativeCurrencyId: WebbCurrencyId.TEDG,
    tag: 'test',
    url: 'wss://beresheet1.edgewa.re'
  },
  // [ChainId.Edgeware]: {
  // chainType: ChainType,
  //   group: 'edgeware',
  //   tag: 'live',
  //   id: ChainId.Edgeware,
  //   evmId: EVMChain.Edgeware,
  //   name: 'Edgeware',
  //   evmRpcUrls: ['https://mainnet.edgewa.re/evm'],
  //   url: 'wss://mainnet1.edgewa.re',
  //   logo: undefined,
  //   currencies: [
  //     {
  //       currencyId: WebbCurrencyId.EDG,
  //       enabled: true,
  //     },
  //   ],
  //   nativeCurrencyId: WebbCurrencyId.EDG,
  // },

  [InternalChainId.Rinkeby]: {
    blockExplorerStub: 'https://rinkeby.etherscan.io',
    chainId: EVMChainId.Rinkeby,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://rinkeby.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    group: 'eth',
    id: InternalChainId.Rinkeby,
    logo: undefined,
    name: 'Rinkeby',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'test',
    url: 'https://rinkeby.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'
  },
  [InternalChainId.Ropsten]: {
    blockExplorerStub: 'https://ropsten.etherscan.io',
    chainId: EVMChainId.Ropsten,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://ropsten.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    group: 'eth',
    id: InternalChainId.Ropsten,
    logo: undefined,
    name: 'Ropsten',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'test',
    url: 'https://ropsten.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'
  },
  [InternalChainId.Goerli]: {
    blockExplorerStub: 'https://goerli.etherscan.io',
    chainId: EVMChainId.Goerli,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://goerli.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    group: 'eth',
    id: InternalChainId.Goerli,
    logo: undefined,
    name: 'Goerli',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'test',
    url: 'https://goerli.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'
  },
  [InternalChainId.Kovan]: {
    blockExplorerStub: 'https://kovan.etherscan.io',
    chainId: EVMChainId.Kovan,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://goerli.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'],
    group: 'eth',
    id: InternalChainId.Kovan,
    logo: undefined,
    name: 'Kovan',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'test',
    url: 'https://kovan.infura.io/v3/e54b7176271840f9ba62e842ff5d6db4'
  },
  [InternalChainId.OptimismTestnet]: {
    blockExplorerStub: 'https://kovan-optimistic.etherscan.io',
    chainId: EVMChainId.OptimismTestnet,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://kovan.optimism.io'],
    group: 'eth',
    id: InternalChainId.OptimismTestnet,
    logo: undefined,
    name: 'Optimism Testnet',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'test',
    url: 'https://kovan.optimism.io'
  },
  [InternalChainId.ArbitrumTestnet]: {
    blockExplorerStub: 'https://testnet.arbiscan.io',
    chainId: EVMChainId.ArbitrumTestnet,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
    group: 'eth',
    id: InternalChainId.ArbitrumTestnet,
    logo: undefined,
    name: 'Arbitrum Testnet',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'test',
    url: 'https://rinkeby.arbitrum.io/rpc'
  },
  [InternalChainId.HarmonyTestnet1]: {
    chainId: EVMChainId.HarmonyTestnet1,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ONE],
    evmRpcUrls: ['https://api.s1.b.hmny.io'],
    group: 'one',
    id: InternalChainId.HarmonyTestnet1,
    logo: undefined,
    name: 'Harmony Testnet Shard 1',
    nativeCurrencyId: WebbCurrencyId.ONE,
    tag: 'test',
    url: 'https://api.s1.b.hmny.io'
  },
  // [ChainId.HarmonyTestnet0]: {
  // chainType: ChainType,
  //   group: 'one',
  //   id: ChainId.HarmonyTestnet0,
  //   evmId: EVMChain.HarmonyTestnet0,
  //   name: 'Harmony Testnet Shard 0',
  //   tag: 'test',
  //   url: 'https://api.s0.b.hmny.io',
  //   evmRpcUrls: ['https://api.s0.b.hmny.io'],
  //   logo: undefined,
  //   currencies: [
  //     {
  //       currencyId: WebbCurrencyId.ONE,
  //       enabled: true,
  //     },
  //   ],
  //   nativeCurrencyId: WebbCurrencyId.ONE,
  // },
  [InternalChainId.HarmonyMainnet0]: {
    chainId: EVMChainId.HarmonyMainnet0,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ONE],
    evmRpcUrls: ['https://api.harmony.one'],
    group: 'one',
    id: InternalChainId.HarmonyMainnet0,
    logo: undefined,
    name: 'Harmony Mainnet Shard 0',
    nativeCurrencyId: WebbCurrencyId.ONE,
    tag: 'live',
    url: 'https://api.harmony.one'
  },
  // [ChainId.EthereumMainNet]: {
  // chainType: ChainType,
  //   group: 'eth',
  //   id: ChainId.EthereumMainNet,
  //   evmId: EVMChain.EthereumMainNet,
  //   name: 'Ethereum mainnet',
  //   tag: 'live',
  //   url: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  //   evmRpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
  //   logo: undefined,
  //   currencies: [
  //     {
  //       currencyId: WebbCurrencyId.ETH,
  //       enabled: true,
  //     },
  //   ],
  //   nativeCurrencyId: WebbCurrencyId.ETH,
  // },
  [InternalChainId.Shiden]: {
    blockExplorerStub: 'https://shiden.subscan.io',
    chainId: EVMChainId.Shiden,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.SDN],
    evmRpcUrls: ['https://shiden.api.onfinality.io/public'],
    group: 'sdn',
    id: InternalChainId.Shiden,
    logo: undefined,
    name: 'Shiden',
    nativeCurrencyId: WebbCurrencyId.SDN,
    tag: 'live',
    url: 'https://shiden.api.onfinality.io/public'
  },
  [InternalChainId.PolygonTestnet]: {
    blockExplorerStub: 'https://mumbai.polygonscan.com/',
    chainId: EVMChainId.PolygonTestnet,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.MATIC, WebbCurrencyId.WETH],
    evmRpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    group: 'matic',
    id: InternalChainId.PolygonTestnet,
    logo: undefined,
    name: 'Polygon Testnet',
    nativeCurrencyId: WebbCurrencyId.MATIC,
    tag: 'test',
    url: 'https://rpc-mumbai.maticvigil.com/'
  },
  [InternalChainId.HermesLocalnet]: {
    chainId: EVMChainId.HermesLocalnet,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.DEV],
    evmRpcUrls: ['http://127.0.0.1:5001'],
    group: 'eth',
    id: InternalChainId.HermesLocalnet,
    logo: undefined,
    name: 'Hermes Localnet',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'dev',
    url: 'http://127.0.0.1:5001'
  },
  [InternalChainId.AthenaLocalnet]: {
    chainId: EVMChainId.AthenaLocalnet,
    chainType: ChainType.EVM,
    currencies: [WebbCurrencyId.ETH, WebbCurrencyId.DEV],
    evmRpcUrls: ['http://127.0.0.1:5002'],
    group: 'eth',
    id: InternalChainId.AthenaLocalnet,
    logo: undefined,
    name: 'Athena Localnet',
    nativeCurrencyId: WebbCurrencyId.ETH,
    tag: 'dev',
    url: 'http://127.0.0.1:5002'
  }
};
const bridgeConfigByAsset: AppConfig['bridgeByAsset'] = {
  [WebbCurrencyId.webbWETH]: {
    anchors: anchorsConfig[WebbCurrencyId.webbWETH],
    asset: WebbCurrencyId.webbWETH
  },
  [WebbCurrencyId.WEBB]: {
    anchors: anchorsConfig[WebbCurrencyId.WEBB],
    asset: WebbCurrencyId.WEBB
  },
  [WebbCurrencyId.webbDEV]: {
    anchors: anchorsConfig[WebbCurrencyId.webbDEV],
    asset: WebbCurrencyId.webbDEV
  }
};
const currenciesConfig: AppConfig['currencies'] = {
  [WebbCurrencyId.EDG]: {
    addresses: new Map(),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.EDG,
    name: 'Edgeware token',
    role: CurrencyRole.Wrappable,
    symbol: 'EDG',
    type: CurrencyType.ORML
  },
  [WebbCurrencyId.TEDG]: {
    addresses: new Map(),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.TEDG,
    name: 'Edgeware testnet token',
    role: CurrencyRole.Wrappable,
    symbol: 'tEDG',
    type: CurrencyType.ORML
  },
  [WebbCurrencyId.ETH]: {
    addresses: new Map([
      [InternalChainId.Ropsten, zeroAddress],
      [InternalChainId.Rinkeby, zeroAddress],
      [InternalChainId.Goerli, zeroAddress],
      [InternalChainId.Kovan, zeroAddress],
      [InternalChainId.OptimismTestnet, zeroAddress],
      [InternalChainId.ArbitrumTestnet, zeroAddress],
      [InternalChainId.HermesLocalnet, zeroAddress],
      [InternalChainId.AthenaLocalnet, zeroAddress]
    ]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.ETH,
    name: 'Ethereum',
    role: CurrencyRole.Wrappable,
    symbol: 'ETH',
    type: CurrencyType.NATIVE
  },
  [WebbCurrencyId.ONE]: {
    addresses: new Map([
      [InternalChainId.HarmonyMainnet0, zeroAddress],
      [InternalChainId.HarmonyTestnet0, zeroAddress],
      [InternalChainId.HarmonyTestnet1, zeroAddress]
    ]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.ONE,
    name: 'Harmony',
    role: CurrencyRole.Wrappable,
    symbol: 'ONE',
    type: CurrencyType.NATIVE
  },
  [WebbCurrencyId.WEBB]: {
    // IS THIS AN EVM CHAIN?
    addresses: new Map([[InternalChainId.WebbDevelopment, ZERO]]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.WEBB,
    name: 'WEBB',
    role: CurrencyRole.Governable,
    symbol: 'WEBB',
    type: CurrencyType.ORML
  },
  [WebbCurrencyId.SDN]: {
    addresses: new Map([[InternalChainId.Shiden, zeroAddress]]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.SDN,
    name: 'Shiden',
    role: CurrencyRole.Wrappable,
    symbol: 'SDN',
    type: CurrencyType.NATIVE
  },
  [WebbCurrencyId.WETH]: {
    addresses: new Map([
      [InternalChainId.Ropsten, '0xc778417E063141139Fce010982780140Aa0cD5Ab'],
      [InternalChainId.Rinkeby, '0xc778417E063141139Fce010982780140Aa0cD5Ab'],
      [InternalChainId.Goerli, '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'],
      [InternalChainId.Kovan, '0xd0A1E359811322d97991E03f863a0C30C2cF029C'],
      [InternalChainId.OptimismTestnet, '0xbC6F6b680bc61e30dB47721c6D1c5cde19C1300d'],
      [InternalChainId.ArbitrumTestnet, '0xEBbc3452Cc911591e4F18f3b36727Df45d6bd1f9'],
      [InternalChainId.PolygonTestnet, '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889']
    ]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.WETH,
    imageUrl: 'https://www.polysa.finance/images/farms/weth.png',
    name: 'Wrapped Ethereum',
    role: CurrencyRole.Wrappable,
    symbol: 'WETH',
    type: CurrencyType.ERC20
  },
  [WebbCurrencyId.MATIC]: {
    addresses: new Map([[InternalChainId.PolygonTestnet, zeroAddress]]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.MATIC,
    name: 'Polygon',
    role: CurrencyRole.Wrappable,
    symbol: 'MATIC',
    type: CurrencyType.NATIVE
  },
  [WebbCurrencyId.webbWETH]: {
    addresses: new Map([
      [InternalChainId.Ropsten, '0x105779076d17FAe5EAADF010CA677475549F49E4'],
      [InternalChainId.Rinkeby, '0x4e7D4BEe028655F2865d9D147cF7B609c516d39C'],
      [InternalChainId.Goerli, '0x5257c558c246311552A824c491285667B3a445a2'],
      [InternalChainId.PolygonTestnet, '0x50A7b748F3C50F808a289cA041E48834A41A6d95'],
      [InternalChainId.OptimismTestnet, '0xEAF873F1F6c91fEf73d4839b5fC7954554BBE518'],
      [InternalChainId.ArbitrumTestnet, '0xD6F1E78B5F1Ebf8fF5a60C9d52eabFa73E5c5220']
    ]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.webbWETH,
    name: 'webbETH-test-1',
    role: CurrencyRole.Governable,
    symbol: 'webbWETH',
    type: CurrencyType.ERC20
  },
  [WebbCurrencyId.DEV]: {
    addresses: new Map([
      [InternalChainId.HermesLocalnet, '0x2946259E0334f33A064106302415aD3391BeD384'],
      [InternalChainId.AthenaLocalnet, '0xF2E246BB76DF876Cef8b38ae84130F4F55De395b']
    ]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.DEV,
    name: 'Development Token',
    role: CurrencyRole.Wrappable,
    symbol: 'DEV',
    type: CurrencyType.ERC20
  },
  [WebbCurrencyId.webbDEV]: {
    addresses: new Map([
      [InternalChainId.HermesLocalnet, '0xD24260C102B5D128cbEFA0F655E5be3c2370677C'],
      [InternalChainId.AthenaLocalnet, '0xD30C8839c1145609E564b986F667b273Ddcb8496']
    ]),
    color: '',
    icon: undefined,
    id: WebbCurrencyId.webbDEV,
    name: 'Webb Development Token',
    role: CurrencyRole.Governable,
    symbol: 'webbDEV',
    type: CurrencyType.ERC20
  }
};

const walletsConfig: AppConfig['wallet'] = {};

export const mockAppConfig: AppConfig = {
  anchors: anchorsConfig,
  bridgeByAsset: bridgeConfigByAsset,
  chains: chainsConfig,
  currencies: currenciesConfig,
  wallet: walletsConfig
};
