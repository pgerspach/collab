import { combineReducers } from 'redux';
import { reducer as sessionReducer } from './session/reducer';

export const reducer = combineReducers({
	session: sessionReducer
});