import {WalletLimits} from "./wallet-limits";
import {WalletState} from "./wallet-state";
import {StateBuilder} from "../../../lib";
import {WalletCreated, WalletEvent, WalletLimitSet} from "./events";

export const walletStateBuilder: StateBuilder<WalletState, WalletEvent> = {
  initialState: () => {
    return new WalletState(null, new WalletLimits())
  },
  applyWalletCreated: (state: WalletState, event: WalletCreated): WalletState => {
    return new WalletState(event.data.walletId, state.limits)
  },
  applyWalletLimitSet: (state: WalletState, event: WalletLimitSet): WalletState => {
    const data = event.data;
    const limits = state.limits.applyLimit(data.period, data.limit, data.activeFrom)
    return new WalletState(state.walletId, limits)
  }
}
