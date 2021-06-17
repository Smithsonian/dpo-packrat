/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { apolloClient } from '../../../graphql';
import {
    GetUnitsFromNameSearchDocument,
    GetUnitsFromEdanAbbreviationDocument,
    CreateGeoLocationDocument,
    CreateSubjectDocument,
    CreateSubjectInput,
} from '../../../types/graphql';
import { CoordinateValues } from '../components/Subject/SubjectForm';

export async function getUnitsList() {
    return await apolloClient.query({
        query: GetUnitsFromNameSearchDocument,
        variables: {
            input: {
                search: ''
            }
        }
    });
}

export async function getUnitFromEdanAbbreviation(abbreviation: string) {
    return await apolloClient.query({
        query: GetUnitsFromEdanAbbreviationDocument,
        variables: {
            input: {
                abbreviation
            }
        }
    });
}

export async function createLocation(coordinates: CoordinateValues) {
    return await apolloClient.mutate({
        mutation: CreateGeoLocationDocument,
        variables: {
            input: {
                ...coordinates
            }
        }
    });
}

export async function createSubject(subjectInput: CreateSubjectInput) {
    return await apolloClient.mutate({
        mutation: CreateSubjectDocument,
        variables: {
            input: {
                ...subjectInput
            }
        }
    });
}