import store from "collab/src/store";

import * as api from "./api";
import * as selectors from "./selectors";
import * as actionCreators from "./actions";
import { initialState } from "./reducer";

// const SESSION_TIMEOUT_THRESHOLD = 300; // Will refresh the access token 5 minutes before it expires // Not using refresh tokens

// let sessionTimeout = null; // Not using refresh tokens

// const setSessionTimeout = duration => { // Not using refresh tokens
//   clearTimeout(sessionTimeout);
//   sessionTimeout = setTimeout(
//     refreshToken, // eslint-disable-line no-use-before-define
//     (duration - SESSION_TIMEOUT_THRESHOLD) * 1000
//   );
// };

const clearSession = () => {
  // clearTimeout(sessionTimeout); // Not using refresh tokens
  store.dispatch(actionCreators.update(initialState));
};

const onRequestSuccess = response => {
  const tokens = response.tokens.reduce(
    (prev, item) => ({
      ...prev,
      [item.type]: item
    }),
    {}
  );
  store.dispatch(actionCreators.update({ tokens, user: response.user }));
  // setSessionTimeout(tokens.access.expiresIn); // Not using refresh tokens
};

const onRequestFailed = exception => {
  clearSession();
  throw exception;
};
export const accessToken = () => {
  const session = selectors.get();
  if (!session.tokens.access.value || !session.user.id) return Promise.reject();

  return api
    .checkAccess(session.tokens.access, session.user)
    .then()
    .catch(onRequestFailed);
};
// export const refreshToken = () => { // Not using refresh tokens
//   const session = selectors.get();

//   if (!session.tokens.refresh.value || !session.user.id) {
//     return Promise.reject();
//   }

//   return api
//     .refresh(session.tokens.refresh, session.user)
//     .then(onRequestSuccess)
//     .catch(onRequestFailed);
// };

export const authenticate = (email, password) => {
  return api
    .authenticate(email, password)
    .then(onRequestSuccess)
    .catch(onRequestFailed);
};

export const revoke = () => {
  const session = selectors.get();
  return api
    .revoke(
      Object.keys(session.tokens).map(tokenKey => ({
        type: session.tokens[tokenKey].type,
        value: session.tokens[tokenKey].value
      }))
    )
    .then(clearSession())
    .catch(() => {});
};
