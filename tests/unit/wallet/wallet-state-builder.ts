import {WalletLimits} from "./wallet-limits";
import {WalletState} from "./wallet-state";
import {WalletLimitSet} from "./wallet-limit-set";
import {WalletCreated} from "./wallet-created";
import {DefaultHandler, DomainEvent, EventHandler} from "../../../lib";

export class WalletStateBuilder {

  public get initialState() {
    return () => new WalletState(null, new WalletLimits())
  }

  @EventHandler(WalletCreated)
  public handleWalletCreated(state: WalletState, event: DomainEvent<WalletCreated>): WalletState {
    return new WalletState(event.data.walletId, state.limits)
  }

  @EventHandler(WalletLimitSet)
  public handleWalletLimitSet(state: WalletState, event: DomainEvent<WalletLimitSet>): WalletState {
    const data = event.data;
    const limits = state.limits.applyLimit(data.period, data.limit, data.activeFrom)
    return new WalletState(state.walletId, limits)
  }

  @DefaultHandler()
  public handleEvent(state: WalletState, event: DomainEvent<any>): WalletState {
    return state
  }

}
