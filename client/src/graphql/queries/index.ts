import { loader } from 'graphql.macro';

const QUERY_GET_USER = loader('./getUser.graphql');
const QUERY_GET_CURRENT_USER = loader('./getCurrentUser.graphql');

export { QUERY_GET_USER, QUERY_GET_CURRENT_USER };
