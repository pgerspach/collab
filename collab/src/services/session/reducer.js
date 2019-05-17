import * as actionTypes from "./actionTypes";

export const initialState = {
  tokens: {
    access: {
      type: null,
      value: null
    }
  },
  user: {
    id: null
  }
};

export const reducer = (state = initialState, action) => {
  console.log('action: ',action);
  switch (action.type) {
    case actionTypes.UPDATE:
      return {
        ...state,
        ...action.session
      };
    default:
      return state;
  }
};
