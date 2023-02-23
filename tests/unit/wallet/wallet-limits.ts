import {Period} from "./events";

export interface WalletLimit {
  period: Period,
  limit: number,
  activeFrom: number
}

export class WalletLimits {

  private readonly limits: WalletLimit[] = []

  get toArray() {
    return this.limits
  }

  public applyLimit(period: Period, limit: number, activeFrom: number) {
    this.limits.unshift({period, limit, activeFrom})
    return this
  }

  public calculateActivationTime(period: Period, limit: number, now: number, expectZero: boolean): number | undefined {

    console.log(`Calculating activation time for [${period}], [${limit}], [${now}] - current limits:`, this.limits)

    const allActive = this.limits
        .filter(l => l.period === period)
        .filter(l => l.activeFrom <= now)

    if ((allActive.length > 0) && expectZero) {
      throw Error('Should be zero')
    }

    return now
  }
}
