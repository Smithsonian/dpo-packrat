import { importGraphQL } from '../../../utils';

const licenceTypes = importGraphQL(__dirname, 'types.graphql');

import licenceResolvers from './resolvers';

export { licenceTypes, licenceResolvers };
