/**
 * Repository hook
 *
 * This custom hook provides reusable functions for getting repository tree data.
 */
import { ApolloQueryResult } from '@apollo/client';
import { RepositoryFilter } from '..';
import { apolloClient } from '../../../graphql';
import { GetObjectChildrenDocument, GetObjectChildrenQuery } from '../../../types/graphql';

function getObjectChildrenForRoot(filter: RepositoryFilter): Promise<ApolloQueryResult<GetObjectChildrenQuery>> {
    return apolloClient.query({
        query: GetObjectChildrenDocument,
        variables: {
            input: {
                idRoot: 0,
                objectTypes: filter.repositoryRootType,
                metadataColumns: filter.metadataToDisplay,
                objectsToDisplay: filter.objectsToDisplay,
                search: filter.search,
                units: filter.units,
                projects: filter.projects,
                has: filter.has,
                missing: filter.missing,
                captureMethod: filter.captureMethod,
                variantType: filter.variantType,
                modelPurpose: filter.modelPurpose,
                modelFileType: filter.modelFileType,
            }
        }
    });
}

function getObjectChildren(idRoot: number, filter: RepositoryFilter): Promise<ApolloQueryResult<GetObjectChildrenQuery>> {
    return apolloClient.query({
        query: GetObjectChildrenDocument,
        variables: {
            input: {
                idRoot,
                objectTypes: [],
                metadataColumns: filter.metadataToDisplay,
                objectsToDisplay: filter.objectsToDisplay,
                search: filter.search,
                units: filter.units,
                projects: filter.projects,
                has: filter.has,
                missing: filter.missing,
                captureMethod: filter.captureMethod,
                variantType: filter.variantType,
                modelPurpose: filter.modelPurpose,
                modelFileType: filter.modelFileType,
            }
        }
    });
}

export { getObjectChildrenForRoot, getObjectChildren };
