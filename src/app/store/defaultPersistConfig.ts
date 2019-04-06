import { persistVersion, defaultMigration } from "./defautMigration";
import { AsyncStorage } from "react-native";
import storage from 'redux-persist/lib/storage'
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2'
import { createMigrate } from "redux-persist";
import { __DEBUG__, IS_MOBILE } from "../constants";

export const defaultPersistConfig = {
  version: persistVersion,
  debug: __DEBUG__,
  timeout: 10000,
  storage: IS_MOBILE ? AsyncStorage : storage,
  stateReconciler: autoMergeLevel2,
  migrate: createMigrate(defaultMigration, { debug: false }),
}