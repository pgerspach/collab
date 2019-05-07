import { fetchApi } from "collab/src/services/api";

const endPoints = {
  create: "/users/create",
  get: "/users/get"
};

export const create = payload => fetchApi(endPoints.create, payload, "post");

export const get = payload => fetchApi(endPoints.get, payload, "get");