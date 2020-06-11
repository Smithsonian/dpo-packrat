import { importGraphQL } from '../../../utils';

const modelTypes = importGraphQL(__dirname, 'types.graphql');

import modelResolvers from './resolvers';

export { modelTypes, modelResolvers };
