import { importGraphQL } from '../../../utils';

const unitTypes = importGraphQL(__dirname, 'types.graphql');

import unitResolvers from './resolvers';

export { unitTypes, unitResolvers };
