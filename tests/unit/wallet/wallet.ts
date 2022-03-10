import {WalletStateBuilder} from "./wallet-state-builder";
import {WalletState} from "./wallet-state";
import {Period, WalletLimitSet} from "./wallet-limit-set";
import {Aggregate, DomainEvent} from "../../../lib";

@Aggregate('wallet', WalletStateBuilder)
export class Wallet {

  constructor(private readonly state: WalletState) {
  }

  public setLimits(limit: number, setAt: number, expectZero: boolean): DomainEvent<WalletLimitSet>[] {

    const activeFrom = this.state.limits.calculateActivationTime(Period.DAY, limit, setAt, expectZero)

    if (activeFrom !== setAt) {
      throw Error('Time mismatch')
    }

    return [DomainEvent.create(new WalletLimitSet(this.state.walletId, Period.DAY, 200, 100, 100))]
  }

}
