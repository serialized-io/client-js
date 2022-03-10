export enum Period { DAY = 'day', WEEK = 'week', MONTH = 'month'}

export class WalletLimitSet {
  constructor(readonly walletId: string,
              readonly period: Period,
              readonly limit: number,
              readonly activeFrom: number,
              readonly setAt: number) {
  }
}
