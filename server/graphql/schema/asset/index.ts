import { importGraphQL } from '../../../utils';

const assetTypes = importGraphQL(__dirname, 'types.graphql');

import assetResolvers from './resolvers';

export { assetTypes, assetResolvers };
