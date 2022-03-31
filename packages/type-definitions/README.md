# @webb-tools/api-providers

# Api providers
Api providers for integrating with the webb protocol

Provider generic interface
```ts
export interface WebbApiProvider<T> extends EventBus<WebbProviderEvents> {
  /// Accounts Adapter will have all methods related to the provider accounts
  accounts: AccountsAdapter<any>;
  /// All of the available methods and api of the provider
  methods: WebbMethods<WebbApiProvider<T>>;

  /// A hook will be called to drop the provider and do cleanup listeners etc..
  destroy(): Promise<void> | void;

  capabilities?: ProvideCapabilities;
  // Clean up for the provider that will remove the side effects
  endSession?(): Promise<void>;

  /// relayer
  relayingManager: WebbRelayerBuilder;

  getProvider(): any;

  // Configs
  config: AppConfig;
  // Notification handler
  notificationHandler: NotificationHandler;
  // wasm-utils workers factory
  wasmFactory: WasmFactory;
}

```
The package contains the Api implementation for evm/ substrate
