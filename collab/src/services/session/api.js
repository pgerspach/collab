import { Buffer } from 'buffer';
import { fetchApi } from 'collab/src/services/api';
import apiConfig from 'collab/src/services/api/config';

const endPoints = {
	authenticate: '/users/auth',
	revoke: '/users/auth/revoke',
	refresh: '/users/auth/refresh',
	create:'/users/auth/create'
};

export const authenticate = (email, password) => fetchApi(endPoints.authenticate, {}, 'post', {
	Authorization: `Basic ${new Buffer(`${email}:${password}`).toString('base64')}`,
});

export const refresh = (token, user) => fetchApi(endPoints.refresh, { token, user }, 'post', {
	'Client-ID': apiConfig.clientId,
	Authorization: null,
});

export const revoke = tokens => fetchApi(endPoints.revoke, { tokens }, 'post');