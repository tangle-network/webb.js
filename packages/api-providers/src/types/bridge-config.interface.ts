import { AnchorConfigEntry } from './anchor-config.interface';
import { WebbCurrencyId } from '../enums';

export interface BridgeConfig {
  asset: WebbCurrencyId;
  anchors: AnchorConfigEntry[];
}
