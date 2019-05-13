import * as actionTypes from "./actionTypes";

export const initialState = {
  isHydrated: false
};

export function reducer(state = initialState, action) {
  console.log("action: ", action);
  console.log("state: ", state);

  switch (action.type) {
    case actionTypes.UPDATE:
      return { ...action.payload, ...state };
    case actionTypes.REHYDRATE:
      return action.payload;
    default:
      return state;
  }
}
