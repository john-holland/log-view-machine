import type { CaveDBAdapter } from './CaveDBAdapter';

/**
 * RxDB-style collection facade over {@link CaveDBAdapter} for ViewStateMachine `db` + `find`/`findOne`.
 * Default collection name `views` matches ViewStorageConfig.collection default in runFindFindOne.
 */
export function createCaveDbViewStorageDb(
  adapter: CaveDBAdapter,
  collectionName = 'views'
): Record<string, { find: (selector: Record<string, unknown>) => { exec: () => Promise<unknown[]> }; findOne: (selector: Record<string, unknown>) => { exec: () => Promise<Record<string, unknown> | null> } }> {
  const coll = {
    find(selector: Record<string, unknown>) {
      return {
        exec: () => adapter.find(selector),
      };
    },
    findOne(selector: Record<string, unknown>) {
      return {
        exec: () => adapter.findOne(selector),
      };
    },
  };
  return { [collectionName]: coll };
}
