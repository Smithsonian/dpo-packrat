import { importGraphQL } from '../../../utils';

const captureDataTypes = importGraphQL(__dirname, 'types.graphql');

import captureDataResolvers from './resolvers';

export { captureDataTypes, captureDataResolvers };
