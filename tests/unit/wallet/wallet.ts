import {WalletState} from "./wallet-state";
import {Period, WalletLimitSet} from "./events";

export class Wallet {

  constructor(private readonly state: WalletState) {
  }

  public setLimits(limit: number, setAt: number, expectZero: boolean): [WalletLimitSet] | [] {

    const activeFrom = this.state.limits.calculateActivationTime(Period.DAY, limit, setAt, expectZero)

    if (activeFrom !== setAt) {
      throw Error('Time mismatch')
    }

    return [{
      eventType: 'WalletLimitSet',
      data: {walletId: this.state.walletId, period: Period.DAY, limit: 200, activeFrom: 100, setAt: 100}
    }]
  }

}
