import { Buffer } from "buffer";
import { fetchApi } from "collab/src/services/api";
import apiConfig from "collab/src/services/api/config";

const endPoints = {
  authenticate: "/users/auth",
  revoke: "/users/auth/revoke",
  refresh: "/users/auth/refresh",
  create: "/users/auth/create",
  checkAccess:"/users/ping"
};

export const authenticate = (email, password) =>
  fetchApi(endPoints.authenticate, {}, "post", {
    Authorization: `Basic ${new Buffer(`${email}:${password}`).toString(
      "base64"
    )}`
  });

export const revoke = tokens => fetchApi(endPoints.revoke, { tokens }, "post");

export const checkAccess = (token, user) =>
  fetchApi(endPoints.checkAccess, { token, user }, "post", {
    Authorization: `Token ${accessToken}`
  });
// export const refresh = (token, user) => fetchApi(endPoints.refresh, { token, user }, 'post', {  // Not using refresh tokens
// 	'Client-ID': apiConfig.clientId,
// 	Authorization: null,
// });
