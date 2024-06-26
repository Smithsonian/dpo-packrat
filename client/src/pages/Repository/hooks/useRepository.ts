/**
 * Repository hook
 *
 * This custom hook provides reusable functions for getting repository tree data.
 */
import { ApolloQueryResult } from '@apollo/client';
import { RepositoryFilter } from '..';
import { apolloClient } from '../../../graphql';
import { GetObjectChildrenDocument, GetObjectChildrenQuery } from '../../../types/graphql';
import { repositoryRowCount } from '@dpo-packrat/common';

function getObjectChildrenForRoot(filter: RepositoryFilter, idSystemObject = 0): Promise<ApolloQueryResult<GetObjectChildrenQuery>> {
    return apolloClient.query({
        query: GetObjectChildrenDocument,
        fetchPolicy: 'network-only',
        variables: {
            input: {
                idRoot: filter?.idRoot ?? idSystemObject,
                objectTypes: filter.repositoryRootType,
                metadataColumns: filter.metadataToDisplay,
                objectsToDisplay: filter.objectsToDisplay,
                search: String(filter.search),
                units: filter.units,
                projects: filter.projects,
                has: filter.has,
                missing: filter.missing,
                captureMethod: filter.captureMethod,
                variantType: filter.variantType,
                modelPurpose: filter.modelPurpose,
                modelFileType: filter.modelFileType,
                dateCreatedFrom: filter.dateCreatedFrom,
                dateCreatedTo: filter.dateCreatedTo,
                rows: repositoryRowCount,
                cursorMark: filter.cursorMark ?? ''
            }
        }
    });
}

function getObjectChildren(idRoot: number, filter: RepositoryFilter): Promise<ApolloQueryResult<GetObjectChildrenQuery>> {
    return apolloClient.query({
        query: GetObjectChildrenDocument,
        fetchPolicy: 'network-only',
        variables: {
            input: {
                idRoot,
                objectTypes: [],
                metadataColumns: filter.metadataToDisplay,
                objectsToDisplay: filter.objectsToDisplay,
                search: String(filter.search),
                units: filter.units,
                projects: filter.projects,
                has: filter.has,
                missing: filter.missing,
                captureMethod: filter.captureMethod,
                variantType: filter.variantType,
                modelPurpose: filter.modelPurpose,
                modelFileType: filter.modelFileType,
                dateCreatedFrom: filter.dateCreatedFrom,
                dateCreatedTo: filter.dateCreatedTo,
                rows: repositoryRowCount,
                cursorMark: filter.cursorMark ?? ''
            }
        }
    });
}

export { getObjectChildrenForRoot, getObjectChildren };
