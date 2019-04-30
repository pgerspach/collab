import fetchival from 'fetchival';
import _ from 'lodash';
import * as sessionSelectors from 'MobileApp/src/services/session/selectors';
import apiConfig from './config';

export const fetchApi = (endPoint, payload = {}, method = 'get', headers = {}) => {
	const accessToken = sessionSelectors.get().tokens.access.value;
	return fetchival(`${apiConfig.url}${endPoint}`, {
		headers: _.pickBy({
			...(accessToken ? {
				Authorization: `Bearer ${accessToken}`,
			} : {
				'Client-ID': apiConfig.clientId,
			}),
			...headers,
		}, item => !_.isEmpty(item)),
	})[method.toLowerCase()](payload);
};