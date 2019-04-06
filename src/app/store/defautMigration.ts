// TODO: add migrations when making new releases
// see: https://github.com/rt2zz/redux-persist/blob/master/docs/migrations.md
export const persistVersion = 1
export const defaultMigration = {
  0: (state: any) => {
    return state
  },
  1: (state: any) => {
    return state // current version
  },
  2: () => {
    // for now, just clear all stored state when migrating to new version
    // TODO: add migration when releasing after first release
    return {}
  },
}