import api from '../../../backend/src/index.js';
export const onRequest = ({request, env}) => api.fetch(request, env);
