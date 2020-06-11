import { importGraphQL } from '../../../utils';

const sceneTypes = importGraphQL(__dirname, 'types.graphql');

import sceneResolvers from './resolvers';

export { sceneTypes, sceneResolvers };
