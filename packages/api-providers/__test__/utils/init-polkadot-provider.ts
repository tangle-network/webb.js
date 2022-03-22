/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InjectedAccount, InjectedExtension } from '@polkadot/extension-inject/types';
import { Account, AccountsAdapter, PromiseOrT } from '@webb-tools/api-providers/account/Accounts.adapter';
import { RelayerConfig, WebbRelayerBuilder } from '@webb-tools/api-providers/webb-context/relayer';
import { InternalChainId } from '@webb-tools/api-providers/chains';
import { NotificationPayload, WebbPolkadot } from '@webb-tools/api-providers';
import { InteractiveFeedback } from '@webb-tools/api-providers/webb-error';
import { relayerNameToChainId } from '@webb-tools/api-providers/uitls';
import { mockAppConfig } from './mock-config';
import { PolkadotProvider } from '@webb-tools/api-providers/ext-providers';

const relayerConfig: RelayerConfig[] = [
  {
    endpoint: 'http://localhost:9955'
  },
  {
    endpoint: 'https://relayer.nepoche.com'
  },
  {
    endpoint: 'https://relayer.webb.tools'
  },
  {
    endpoint: 'https://webb.pops.one'
  },
  {
    endpoint: 'https://relayer.bldnodes.org'
  }
];
export function relayerSubstrateNameToChainId(name: string): InternalChainId {
  switch (name) {
    case 'localnode':
      return InternalChainId.WebbDevelopment;
  }

  throw new Error('unhandled relayed chain name  ' + name);
}

const notificationHandler = (m: NotificationPayload) => {
  console.log(m);
  return Math.random();
};
notificationHandler.remove = (id: string | number) => {
  console.log(id);
};

class PolkadotAccounts extends AccountsAdapter<InjectedExtension, InjectedAccount> {
  private activeAccount: null | Account<InjectedAccount> = null;
  accounts(): PromiseOrT<Account<InjectedExtension | InjectedAccount>[]> {
    return [];
  }

  get activeOrDefault(): Promise<Account<InjectedAccount> | null> | Account<InjectedAccount> | null {
    return this.activeAccount;
  }

  providerName = 'Polka';

  setActiveAccount(account: Account<InjectedAccount>): PromiseOrT<void> {
    this.activeAccount = account;
    return undefined;
  }
}
export async function initPolkadotProvider(): Promise<WebbPolkadot> {
  const webbRelayerBuilder = await WebbRelayerBuilder.initBuilder(
    relayerConfig,
    (name, basedOn) => {
      try {
        return basedOn === 'evm' ? relayerNameToChainId(name) : relayerSubstrateNameToChainId(name);
      } catch (e) {
        return null;
      }
    },
    mockAppConfig
  );
  const apiPromise = await PolkadotProvider.getApiPromise('Webb DApp', ['ws://127.0.0.1:9944'], {
    // @ts-ignore
    onError(error: InteractiveFeedback): any {
      console.log(error.reason);
      console.log(error);
    }
  });
  const provider = await WebbPolkadot.initWithCustomAccountsAdapter(
    'Webb DApp',
    ['ws://127.0.0.1:9944'],
    {
      onError(error: InteractiveFeedback): any {
        console.log(error.reason);
        console.log(error);
      }
    },
    webbRelayerBuilder,
    mockAppConfig,
    notificationHandler,
    new PolkadotAccounts({} as any),
    apiPromise,
    {} as any,
    () => null
  );
  return provider;
}
