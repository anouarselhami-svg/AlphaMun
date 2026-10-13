import api from '../../../backend/src/index.js';

// Pages discovers this route from the configured project root: frontend/.
export const onRequest = ({request, env}) => api.fetch(request, env);
