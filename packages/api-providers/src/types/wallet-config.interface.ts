import { ReactElement } from './abstracts';

export interface WalletConfig {
  id: number;
  logo: ReactElement;
  name: string;
  title: string;
  platform: string;

  // the wallet isn't live yet
  enabled: boolean;

  /// a function that will tell weather the wallet is installed or reachable
  detect?(): boolean | Promise<boolean>;

  supportedChainIds: number[];
}

export type ManagedWallet = {
  connected: boolean;
  endSession(): Promise<void>;
  canEndSession: boolean;
} & WalletConfig;
