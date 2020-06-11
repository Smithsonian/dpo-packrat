import { importGraphQL } from '../../../utils';

const vocabularyTypes = importGraphQL(__dirname, 'types.graphql');

import vocabularyResolvers from './resolvers';

export { vocabularyTypes, vocabularyResolvers };
