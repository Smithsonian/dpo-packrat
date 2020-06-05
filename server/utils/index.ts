/**
 * Utils
 * These are utilities for the packrat server
 */

import { GraphQLSchema } from 'graphql';
import { loadSchemaSync, GraphQLFileLoader } from 'graphql-tools';
import { join } from 'path';

export function importGraphQL(directory: string, path: string): GraphQLSchema {
    const resolvedPath = join(directory, path);
    const options = {
        loaders: [new GraphQLFileLoader()]
    };

    return loadSchemaSync(resolvedPath, options);
}
