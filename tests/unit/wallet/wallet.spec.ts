import {v4 as uuidv4} from 'uuid';
import {Wallet} from "./wallet";
import {WalletCreated} from "./wallet-created";
import {AggregatesClient, DomainEvent, LoadAggregateResponse, Serialized} from "../../../lib";
import {Period, WalletLimitSet} from "./wallet-limit-set";
import nock = require("nock");

const {randomKeyConfig} = require("../client-helpers");

describe('Aggregate client', () => {

  afterEach(function () {
    nock.cleanAll()
  })


  it('Should not reuse initial state', async () => {

        const config = randomKeyConfig();
        const aggregatesClient = Serialized.create(config).aggregateClient<Wallet>(Wallet)
        const aggregateType = 'wallet';

        const walletWithLimitsId = uuidv4();
        const existingWalletResponse: LoadAggregateResponse = {
          hasMore: false,
          aggregateId: walletWithLimitsId,
          aggregateVersion: 1,
          events: [
            DomainEvent.create(new WalletCreated(walletWithLimitsId, 0)),
            DomainEvent.create(new WalletLimitSet(walletWithLimitsId, Period.DAY, 20, 100, 10))
          ]
        };

        const newWalletId = uuidv4();
        const newWalletResponse: LoadAggregateResponse = {
          hasMore: false,
          aggregateId: newWalletId,
          aggregateVersion: 1,
          events: [
            DomainEvent.create(new WalletCreated(newWalletId, 0))
          ]
        };

        nock('https://api.serialized.io')
            .get(AggregatesClient.aggregateUrlPath(aggregateType, walletWithLimitsId))
            .matchHeader('Serialized-Access-Key', config.accessKey)
            .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200, existingWalletResponse)
            .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, walletWithLimitsId))
            .matchHeader('Serialized-Access-Key', config.accessKey)
            .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200)

            .get(AggregatesClient.aggregateUrlPath(aggregateType, newWalletId))
            .matchHeader('Serialized-Access-Key', config.accessKey)
            .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200, newWalletResponse)
            .post(AggregatesClient.aggregateEventsUrlPath(aggregateType, newWalletId))
            .matchHeader('Serialized-Access-Key', config.accessKey)
            .matchHeader('Serialized-Secret-Access-Key', config.secretAccessKey)
            .reply(200)

        await aggregatesClient.update(walletWithLimitsId, (aggregate) => {
          return aggregate.setLimits(200, 100, false)
        })

        await aggregatesClient.update(newWalletId, (aggregate) => {
          return aggregate.setLimits(300, 200, true)
        })


      }
  )


});
