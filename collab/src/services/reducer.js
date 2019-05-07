import { combineReducers } from "redux";
import { reducer as sessionReducer } from "./session/reducer";
import { reducer as persistReducer } from "./persist/reducer";


export const reducer = combineReducers({
  session: sessionReducer,
  persist: persistReducer
});
