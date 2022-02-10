/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { apolloClient } from '../../../graphql';
import {
    GetUnitsFromNameSearchDocument,
    GetUnitsFromEdanAbbreviationDocument,
    CreateGeoLocationDocument,
    CreateSubjectDocument,
    CreateSubjectInput,
    GetSubjectListDocument,
    GetSubjectListInput,
    CreateSubjectWithIdentifiersInput,
    CreateSubjectWithIdentifiersDocument,
    UpdateLicenseDocument,
    CreateLicenseDocument,
    UpdateLicenseMutation,
    CreateLicenseMutation,
    GetLicenseListDocument
} from '../../../types/graphql';
import { CoordinateValues } from '../components/Subject/SubjectForm';
import { FetchResult } from '@apollo/client';

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

export async function getSubjectList(input: GetSubjectListInput) {
    return await apolloClient.query({
        query: GetSubjectListDocument,
        variables: {
            input: {
                ...input
            }
        },
        fetchPolicy: 'no-cache'
    });
}

export async function createSubjectWithIdentifiers(input: CreateSubjectWithIdentifiersInput) {
    return await apolloClient.mutate({
        mutation: CreateSubjectWithIdentifiersDocument,
        variables: {
            input: {
                ...input
            }
        }
    });
}

export async function updateLicense(idLicense: number, Name: string, Description: string, RestrictLevel: number): Promise<FetchResult<UpdateLicenseMutation>> {
    return await apolloClient.mutate({
        mutation: UpdateLicenseDocument,
        variables: {
            input: {
                idLicense,
                Name,
                Description,
                RestrictLevel
            }
        },
        refetchQueries: [{ query: GetLicenseListDocument, variables: { input: { search: '' } } }],
        awaitRefetchQueries: true
    });
}

export async function createLicense(Name: string, Description: string, RestrictLevel: number): Promise<FetchResult<CreateLicenseMutation>> {
    return await apolloClient.mutate({
        mutation: CreateLicenseDocument,
        variables: {
            input: {
                Name,
                Description,
                RestrictLevel
            }
        },
        refetchQueries: [{ query: GetLicenseListDocument, variables: { input: { search: '' } } }],
        awaitRefetchQueries: true
    });
}
