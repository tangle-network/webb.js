import { WebbCurrencyId } from '../enums';
import { AppConfig } from '../webb-context';
import { InternalChainId } from '../chains';

export const getAnchorAddressForBridge = (
  assetId: WebbCurrencyId,
  chainId: number,
  amount: number,
  bridgeConfigByAsset: AppConfig['bridgeByAsset']
): string | undefined => {
  const linkedAnchorConfig = bridgeConfigByAsset[assetId]?.anchors.find(
    (anchor) => anchor.amount === amount.toString()
  );
  if (!linkedAnchorConfig) {
    throw new Error('Unsupported configuration for bridge');
  }

  const anchorAddress = linkedAnchorConfig.anchorAddresses[chainId as InternalChainId];
  return anchorAddress;
};
