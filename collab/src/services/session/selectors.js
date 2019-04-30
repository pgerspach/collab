import store from 'collab/src/store';

export const get = () => store.getState().services.session;