import {v4 as uuidv4} from 'uuid';
import {Wallet} from "./wallet";
import {LoadAggregateResponse, Serialized} from "../../../lib";
import {Period, WalletCreated, WalletEvent, WalletLimitSet} from "./events";
import {walletStateBuilder} from "./wallet-state-builder";
import {WalletState} from "./wallet-state";
import nock = require("nock");

const {randomKeyConfig, mockSerializedApiCalls} = require("../client-helpers");

describe('Aggregate client', () => {

  afterEach(function () {
    nock.cleanAll()
  })


  it('Should not reuse initial state', async () => {

        const config = randomKeyConfig();
        const walletClient = Serialized.create(config).aggregateClient({
              aggregateType: 'wallet'
            },
            walletStateBuilder,
            (state: WalletState) => new Wallet(state)
        )

        const walletWithLimitsId = uuidv4();
        const existingWalletResponse: LoadAggregateResponse<WalletEvent> = {
          hasMore: false,
          aggregateId: walletWithLimitsId,
          aggregateVersion: 1,
          events: [
            {eventType: 'WalletCreated', data: {walletId: walletWithLimitsId, createdAt: 0}},
            {
              eventType: 'WalletLimitSet',
              data: {walletId: walletWithLimitsId, period: Period.DAY, limit: 20, activeFrom: 100, setAt: 10}
            }
          ]
        };

        const newWalletId = uuidv4();
        const newWalletResponse: LoadAggregateResponse<WalletEvent> = {
          hasMore: false,
          aggregateId: newWalletId,
          aggregateVersion: 1,
          events: [
            {eventType: 'WalletCreated', data: {walletId: newWalletId, createdAt: 0}}
          ]
        };

        mockSerializedApiCalls(config)
            .get(walletClient.aggregateUrlPath(walletWithLimitsId))
            .query({since: '0', limit: '1000'})
            .reply(200, existingWalletResponse)
            .post(walletClient.aggregateEventsUrlPath(walletWithLimitsId))
            .reply(200)

            .get(walletClient.aggregateUrlPath(newWalletId))
            .query({since: '0', limit: '1000'})
            .reply(200, newWalletResponse)
            .post(walletClient.aggregateEventsUrlPath(newWalletId))
            .reply(200)

        await walletClient.update({aggregateId: walletWithLimitsId}, (aggregate) => {
          return aggregate.setLimits(200, 100, false)
        })

        await walletClient.update({aggregateId: newWalletId}, (aggregate) => {
          return aggregate.setLimits(300, 200, true)
        })


      }
  )


});
