import {DomainEvent} from "../../../lib";

export enum Period { DAY = 'day', WEEK = 'week', MONTH = 'month'}

export type WalletCreated = DomainEvent<'WalletCreated', {
  readonly walletId: string
  readonly createdAt: number
}>

export type WalletLimitSet = DomainEvent<'WalletLimitSet', {
  readonly walletId: string
  readonly period: Period
  readonly limit: number
  readonly activeFrom: number
  readonly setAt: number
}>

export type WalletEvent = WalletCreated | WalletLimitSet
