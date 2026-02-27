import type { ParseCandidateTask } from './types';

type TodoStore = {
  parses: Map<string, ParseCandidateTask[]>;
};

declare global {
  // eslint-disable-next-line no-var
  var __todo_store__: TodoStore | undefined;
}

const buildStore = (): TodoStore => ({
  parses: new Map<string, ParseCandidateTask[]>(),
});

export const store: TodoStore = globalThis.__todo_store__ ?? buildStore();

if (!globalThis.__todo_store__) {
  globalThis.__todo_store__ = store;
}

export const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
