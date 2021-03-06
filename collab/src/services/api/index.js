import fetchival from "fetchival";
import _ from "lodash";
import * as sessionSelectors from "../session/selectors";
import apiConfig from "./config";

export const fetchApi = (
  endPoint,
  payload = {},
  method = "get",
  headers = {}
) => {
  const accessToken = sessionSelectors.get().tokens.access.value;
  console.log(endPoint);
  return fetchival(`${apiConfig.url}${endPoint}`, {
    headers: _.pickBy(
      {
        ...(accessToken
          ? {
              Authorization: `Token ${accessToken}`
            }
          : {}),
        ...headers
      },
      item => !_.isEmpty(item)
    )
  })[method.toLowerCase()](payload);
};
