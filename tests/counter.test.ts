import { describe, expect, it } from 'vitest';

import {
  createConstructorContext,
  createCircuitContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';

import {
  Contract,
  ledger,
  type Witnesses,
} from '../contracts/managed/counter/contract/index.js';

type CounterPrivateState = {
  secret: bigint;
};

const CONTRACT_ADDRESS = sampleContractAddress();

const COIN_PUBLIC_KEY = new Uint8Array(32);

function createCounterSimulator(secret: bigint) {
  const privateState: CounterPrivateState = {
    secret,
  };

  const witnesses: Witnesses<CounterPrivateState> = {
    secret: () => [
      privateState,
      privateState.secret,
    ],
  };

  const contract =
    new Contract<CounterPrivateState>(
      witnesses,
    );

  const constructorContext =
    createConstructorContext<CounterPrivateState>(
      privateState,
      COIN_PUBLIC_KEY,
    );

  const initial =
    contract.initialState(
      constructorContext,
    );

  const context =
    createCircuitContext<CounterPrivateState>(
      CONTRACT_ADDRESS,
      initial.currentZswapLocalState,
      initial.currentContractState,
      initial.currentPrivateState,
    );

  return {
    contract,
    context,
  };
}

describe('Counter contract', () => {
  it('Circuit logic: accepts the correct private secret', () => {
    const secret = 12345n;

    const { contract, context } =
      createCounterSimulator(secret);

    const result =
      contract.impureCircuits.incrementIfValid(
        context,
        secret,
      );

    expect(result.result).toBe(true);
  });

  it('State transition: valid secret increments the public counter', () => {
    const secret = 777n;

    const { contract, context } =
      createCounterSimulator(secret);

    const first =
      contract.impureCircuits.incrementIfValid(
        context,
        secret,
      );

    const firstLedger =
      ledger(
        first.context.currentQueryContext.state,
      );

    expect(firstLedger.counter).toBe(1n);

    const second =
      contract.impureCircuits.incrementIfValid(
        first.context,
        secret,
      );

    const secondLedger =
      ledger(
        second.context.currentQueryContext.state,
      );

    expect(secondLedger.counter).toBe(2n);
  });

  it('Privacy: the private secret is not exposed in public ledger state', () => {
    const secret = 987654321n;

    const { contract, context } =
      createCounterSimulator(secret);

    const result =
      contract.impureCircuits.incrementIfValid(
        context,
        secret,
      );

    const publicLedger =
      ledger(
        result.context.currentQueryContext.state,
      );

    expect(Object.keys(publicLedger)).toEqual([
      'counter',
    ]);

    expect(
      Object.values(publicLedger).map(String),
    ).not.toContain(
      secret.toString(),
    );

    expect(result.result).toBe(true);
    expect(typeof result.result).toBe('boolean');
  });
});