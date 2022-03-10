import {WalletLimits} from "./wallet-limits";

export class WalletState {

  constructor(readonly walletId: string | null, readonly limits: WalletLimits) {
  }

  assertIsWithinLimits(amount: number) {
    let walletLimits = this.limits.toArray;

    if (walletLimits.length > 0) {
      throw Error('Should be zero')
    }

  }


}
