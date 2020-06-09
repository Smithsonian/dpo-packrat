import { importGraphQL } from '../../../utils';

const userTypes = importGraphQL(__dirname, 'types.graphql');
const userQueries = importGraphQL(__dirname, 'queries.graphql');
import userResolvers from './resolvers';

export { userTypes, userQueries, userResolvers };
