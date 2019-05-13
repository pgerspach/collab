import AsyncStorage from '@react-native-community/async-storage';
import { createStore, combineReducers, compose, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import devTools from "remote-redux-devtools";
import { persistStore, autoRehydrate } from "redux-persist";
import createFilter from "redux-persist-transform-filter";

import { reducer as dataReducer } from "./data/reducer";
import { reducer as servicesReducer } from "./services/reducer";
import * as persistActions from "./services/persist/actions";

const appReducer = combineReducers({
  services: servicesReducer,
  data: dataReducer
});

const enhancer = compose(
  applyMiddleware(thunk),
  devTools(),
  autoRehydrate()
);

const store = createStore(appReducer, enhancer);

const saveAndLoadSessionFilter = createFilter(
  "services",
  ["session"]
);

export const persist = persistStore(
  store,
  {
    storage: AsyncStorage,
    blacklist: ["data"],
    transforms: [saveAndLoadSessionFilter]
  },
  () => store.dispatch(persistActions.update({ isHydrated: true }))
);

export default store;
