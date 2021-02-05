/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GraphQLApi
 * This helps with seamless access to our graphql api enabling
 * us to use it in a non-graphql context such as custom REST
 * routes and testing environment
 */
import schema from '../schema';
import { graphql, print, DocumentNode } from 'graphql';
import {
    GetUserInput,
    GetUserResult,
    GetAccessPolicyInput,
    GetAccessPolicyResult,
    GetAssetInput,
    GetAssetResult,
    GetCaptureDataInput,
    GetCaptureDataResult,
    GetCaptureDataPhotoInput,
    GetCaptureDataPhotoResult,
    GetLicenseInput,
    GetLicenseResult,
    GetModelInput,
    GetModelResult,
    GetSceneInput,
    GetSceneResult,
    GetUnitInput,
    GetUnitResult,
    GetProjectInput,
    GetProjectResult,
    GetItemInput,
    GetItemResult,
    GetSubjectInput,
    GetSubjectResult,
    GetVocabularyInput,
    GetVocabularyResult,
    GetWorkflowInput,
    GetWorkflowResult,
    CreateUserInput,
    CreateUserResult,
    CreateCaptureDataInput,
    CreateCaptureDataResult,
    CreateCaptureDataPhotoInput,
    CreateCaptureDataPhotoResult,
    CreateModelInput,
    CreateModelResult,
    CreateSceneInput,
    CreateSceneResult,
    CreateUnitInput,
    CreateUnitResult,
    CreateProjectInput,
    CreateProjectResult,
    CreateItemInput,
    CreateItemResult,
    CreateSubjectInput,
    CreateSubjectResult,
    CreateVocabularyInput,
    CreateVocabularyResult,
    CreateVocabularySetInput,
    UploadAssetInput,
    UploadAssetResult,
    GetUploadedAssetVersionResult,
    CreateVocabularySetResult,
    SearchIngestionSubjectsInput,
    SearchIngestionSubjectsResult,
    GetIngestionItemsForSubjectsInput,
    GetIngestionItemsForSubjectsResult,
    GetIngestionProjectsForSubjectsInput,
    GetIngestionProjectsForSubjectsResult,
    GetVocabularyEntriesInput,
    GetVocabularyEntriesResult,
    GetContentsForAssetVersionsInput,
    GetContentsForAssetVersionsResult,
    AreCameraSettingsUniformInput,
    AreCameraSettingsUniformResult,
    IngestDataInput,
    IngestDataResult,
    GetSubjectsForUnitInput,
    GetSubjectsForUnitResult,
    GetItemsForSubjectInput,
    GetItemsForSubjectResult,
    GetAssetVersionsDetailsInput,
    GetAssetVersionsDetailsResult,
    GetObjectsForItemInput,
    GetObjectsForItemResult,
    GetProjectDocumentationInput,
    GetProjectDocumentationResult,
    GetIntermediaryFileInput,
    GetIntermediaryFileResult,
    DiscardUploadedAssetVersionsInput,
    DiscardUploadedAssetVersionsResult,
    GetObjectChildrenInput,
    GetObjectChildrenResult,
    GetSourceObjectIdentiferInput,
    GetSourceObjectIdentiferResult,
    GetSystemObjectDetailsInput,
    GetSystemObjectDetailsResult,
    GetAssetDetailsForSystemObjectInput,
    GetAssetDetailsForSystemObjectResult,
    GetVersionsForSystemObjectInput,
    GetVersionsForSystemObjectResult,
    GetDetailsTabDataForObjectInput,
    GetDetailsTabDataForObjectResult,
    GetFilterViewDataResult,
    UpdateObjectDetailsInput,
    UpdateObjectDetailsResult,
    GetAllUsersInput,
    GetAllUsersResult
} from '../../types/graphql';

// Queries
import getUser from './queries/user/getUser';
import getCurrentUser from './queries/user/getCurrentUser';
import getAccessPolicy from './queries/accesscontrol/getAccessPolicy';
import getAsset from './queries/asset/getAsset';
import getCaptureData from './queries/capturedata/getCaptureData';
import getCaptureDataPhoto from './queries/capturedata/getCaptureDataPhoto';
import getLicense from './queries/license/getLicense';
import getModel from './queries/model/getModel';
import getScene from './queries/scene/getScene';
import getUnit from './queries/unit/getUnit';
import getProject from './queries/unit/getProject';
import getItem from './queries/unit/getItem';
import getSubject from './queries/unit/getSubject';
import getVocabulary from './queries/vocabulary/getVocabulary';
import getWorkflow from './queries/workflow/getWorkflow';
import getUploadedAssetVersion from './queries/asset/getUploadedAssetVersion';
import searchIngestionSubjects from './queries/unit/searchIngestionSubjects';
import getIngestionItemsForSubjects from './queries/unit/getIngestionItemsForSubjects';
import getIngestionProjectsForSubjects from './queries/unit/getIngestionProjectsForSubjects';
import getVocabularyEntries from './queries/vocabulary/getVocabularyEntries';
import getContentsForAssetVersions from './queries/asset/getContentsForAssetVersions';
import areCameraSettingsUniform from './queries/ingestion/areCameraSettingsUniform';
import getSubjectsForUnit from './queries/unit/getSubjectsForUnit';
import getItemsForSubject from './queries/unit/getItemsForSubject';
import getAssetVersionsDetails from './queries/asset/getAssetVersionsDetails';
import getObjectsForItem from './queries/unit/getObjectsForItem';
import getProjectDocumentation from './queries/unit/getProjectDocumentation';
import getIntermediaryFile from './queries/scene/getIntermediaryFile';
import getObjectChildren from './queries/repository/getObjectChildren';
import getSourceObjectIdentifer from './queries/systemobject/getSourceObjectIdentifer';
import getSystemObjectDetails from './queries/systemobject/getSystemObjectDetails';
import getAssetDetailsForSystemObject from './queries/systemobject/getAssetDetailsForSystemObject';
import getVersionsForSystemObject from './queries/systemobject/getVersionsForSystemObject';
import getDetailsTabDataForObject from './queries/systemobject/getDetailsTabDataForObject';
import getFilterViewData from './queries/repository/getFilterViewData';
import getAllUsers from './queries/user/getAllUsers';

// Mutations
import createUser from './mutations/user/createUser';
import createCaptureData from './mutations/capturedata/createCaptureData';
import createCaptureDataPhoto from './mutations/capturedata/createCaptureDataPhoto';
import createModel from './mutations/model/createModel';
import createScene from './mutations/scene/createScene';
import createUnit from './mutations/unit/createUnit';
import createProject from './mutations/unit/createProject';
import createItem from './mutations/unit/createItem';
import createSubject from './mutations/unit/createSubject';
import createVocabulary from './mutations/vocabulary/createVocabulary';
import createVocabularySet from './mutations/vocabulary/createVocabularySet';
import uploadAsset from './mutations/asset/uploadAsset';
import ingestData from './mutations/ingestion/ingestData';
import discardUploadedAssetVersions from './mutations/asset/discardUploadedAssetVersions';
import updateObjectDetails from './mutations/systemobject/updateObjectDetails';

import { Context } from '../../types/resolvers';

const allQueries = {
    getUser,
    getCurrentUser,
    getAccessPolicy,
    getAsset,
    getCaptureData,
    getCaptureDataPhoto,
    getLicense,
    getModel,
    getScene,
    getUnit,
    getProject,
    getItem,
    getSubject,
    getVocabulary,
    getWorkflow,
    createUser,
    createCaptureData,
    createCaptureDataPhoto,
    createModel,
    createScene,
    createUnit,
    createProject,
    createItem,
    createSubject,
    createVocabulary,
    createVocabularySet,
    uploadAsset,
    getUploadedAssetVersion,
    searchIngestionSubjects,
    getIngestionItemsForSubjects,
    getIngestionProjectsForSubjects,
    getVocabularyEntries,
    getContentsForAssetVersions,
    areCameraSettingsUniform,
    ingestData,
    getSubjectsForUnit,
    getItemsForSubject,
    getAssetVersionsDetails,
    getObjectsForItem,
    getProjectDocumentation,
    getIntermediaryFile,
    discardUploadedAssetVersions,
    getObjectChildren,
    getSourceObjectIdentifer,
    getSystemObjectDetails,
    getAssetDetailsForSystemObject,
    getVersionsForSystemObject,
    getDetailsTabDataForObject,
    getFilterViewData,
    updateObjectDetails,
    getAllUsers
};

type GraphQLRequest = {
    query?: string;
    variables: any;
    context?: Context;
    operationName: string;
};

class GraphQLApi {
    async getUser(input: GetUserInput, context?: Context): Promise<GetUserResult> {
        const operationName = 'getUser';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getCurrentUser(context: Context): Promise<GetUserResult> {
        const operationName = 'getCurrentUser';
        const variables = {};
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async uploadAsset(input: UploadAssetInput, context: Context): Promise<UploadAssetResult> {
        const operationName = 'uploadAsset';
        const variables = input;
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getUploadedAssetVersion(context: Context): Promise<GetUploadedAssetVersionResult> {
        const operationName = 'getUploadedAssetVersion';
        const variables = {};
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createUser(input: CreateUserInput, context?: Context): Promise<CreateUserResult> {
        const operationName = 'createUser';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAccessPolicy(input: GetAccessPolicyInput, context?: Context): Promise<GetAccessPolicyResult> {
        const operationName = 'getAccessPolicy';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAsset(input: GetAssetInput, context?: Context): Promise<GetAssetResult> {
        const operationName = 'getAsset';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getCaptureData(input: GetCaptureDataInput, context?: Context): Promise<GetCaptureDataResult> {
        const operationName = 'getCaptureData';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getCaptureDataPhoto(input: GetCaptureDataPhotoInput, context?: Context): Promise<GetCaptureDataPhotoResult> {
        const operationName = 'getCaptureDataPhoto';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createCaptureData(input: CreateCaptureDataInput, context?: Context): Promise<CreateCaptureDataResult> {
        const operationName = 'createCaptureData';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createCaptureDataPhoto(input: CreateCaptureDataPhotoInput, context?: Context): Promise<CreateCaptureDataPhotoResult> {
        const operationName = 'createCaptureDataPhoto';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getLicense(input: GetLicenseInput, context?: Context): Promise<GetLicenseResult> {
        const operationName = 'getLicense';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getModel(input: GetModelInput, context?: Context): Promise<GetModelResult> {
        const operationName = 'getModel';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createModel(input: CreateModelInput, context?: Context): Promise<CreateModelResult> {
        const operationName = 'createModel';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getScene(input: GetSceneInput, context?: Context): Promise<GetSceneResult> {
        const operationName = 'getScene';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createScene(input: CreateSceneInput, context?: Context): Promise<CreateSceneResult> {
        const operationName = 'createScene';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async searchIngestionSubjects(input: SearchIngestionSubjectsInput, context?: Context): Promise<SearchIngestionSubjectsResult> {
        const operationName = 'searchIngestionSubjects';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getIngestionItemsForSubjects(input: GetIngestionItemsForSubjectsInput, context?: Context): Promise<GetIngestionItemsForSubjectsResult> {
        const operationName = 'getIngestionItemsForSubjects';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getIngestionProjectsForSubjects(input: GetIngestionProjectsForSubjectsInput, context?: Context): Promise<GetIngestionProjectsForSubjectsResult> {
        const operationName = 'getIngestionProjectsForSubjects';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getVocabularyEntries(input: GetVocabularyEntriesInput, context?: Context): Promise<GetVocabularyEntriesResult> {
        const operationName = 'getVocabularyEntries';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getContentsForAssetVersions(input: GetContentsForAssetVersionsInput, context?: Context): Promise<GetContentsForAssetVersionsResult> {
        const operationName = 'getContentsForAssetVersions';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async areCameraSettingsUniform(input: AreCameraSettingsUniformInput, context?: Context): Promise<AreCameraSettingsUniformResult> {
        const operationName = 'areCameraSettingsUniform';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async ingestData(input: IngestDataInput, context?: Context): Promise<IngestDataResult> {
        const operationName = 'ingestData';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getSubjectsForUnit(input: GetSubjectsForUnitInput, context?: Context): Promise<GetSubjectsForUnitResult> {
        const operationName = 'getSubjectsForUnit';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getItemsForSubject(input: GetItemsForSubjectInput, context?: Context): Promise<GetItemsForSubjectResult> {
        const operationName = 'getItemsForSubject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAssetVersionsDetails(input: GetAssetVersionsDetailsInput, context?: Context): Promise<GetAssetVersionsDetailsResult> {
        const operationName = 'getAssetVersionsDetails';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getObjectsForItem(input: GetObjectsForItemInput, context?: Context): Promise<GetObjectsForItemResult> {
        const operationName = 'getObjectsForItem';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getProjectDocumentation(input: GetProjectDocumentationInput, context?: Context): Promise<GetProjectDocumentationResult> {
        const operationName = 'getProjectDocumentation';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getIntermediaryFile(input: GetIntermediaryFileInput, context?: Context): Promise<GetIntermediaryFileResult> {
        const operationName = 'getIntermediaryFile';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getUnit(input: GetUnitInput, context?: Context): Promise<GetUnitResult> {
        const operationName = 'getUnit';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async discardUploadedAssetVersions(input: DiscardUploadedAssetVersionsInput, context?: Context): Promise<DiscardUploadedAssetVersionsResult> {
        const operationName = 'discardUploadedAssetVersions';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getObjectChildren(input: GetObjectChildrenInput, context?: Context): Promise<GetObjectChildrenResult> {
        const operationName = 'getObjectChildren';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getSourceObjectIdentifer(input: GetSourceObjectIdentiferInput, context?: Context): Promise<GetSourceObjectIdentiferResult> {
        const operationName = 'getSourceObjectIdentifer';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getSystemObjectDetails(input: GetSystemObjectDetailsInput, context?: Context): Promise<GetSystemObjectDetailsResult> {
        const operationName = 'getSystemObjectDetails';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAssetDetailsForSystemObject(input: GetAssetDetailsForSystemObjectInput, context?: Context): Promise<GetAssetDetailsForSystemObjectResult> {
        const operationName = 'getAssetDetailsForSystemObject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getVersionsForSystemObject(input: GetVersionsForSystemObjectInput, context?: Context): Promise<GetVersionsForSystemObjectResult> {
        const operationName = 'getVersionsForSystemObject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getDetailsTabDataForObject(input: GetDetailsTabDataForObjectInput, context?: Context): Promise<GetDetailsTabDataForObjectResult> {
        const operationName = 'getDetailsTabDataForObject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getFilterViewData(context?: Context): Promise<GetFilterViewDataResult> {
        const operationName = 'getFilterViewData';
        const variables = {};
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async updateObjectDetails(input: UpdateObjectDetailsInput, context?: Context): Promise<UpdateObjectDetailsResult> {
        const operationName = 'updateObjectDetails';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createUnit(input: CreateUnitInput, context?: Context): Promise<CreateUnitResult> {
        const operationName = 'createUnit';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getProject(input: GetProjectInput, context?: Context): Promise<GetProjectResult> {
        const operationName = 'getProject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createProject(input: CreateProjectInput, context?: Context): Promise<CreateProjectResult> {
        const operationName = 'createProject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getItem(input: GetItemInput, context?: Context): Promise<GetItemResult> {
        const operationName = 'getItem';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createItem(input: CreateItemInput, context?: Context): Promise<CreateItemResult> {
        const operationName = 'createItem';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getSubject(input: GetSubjectInput, context?: Context): Promise<GetSubjectResult> {
        const operationName = 'getSubject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createSubject(input: CreateSubjectInput, context?: Context): Promise<CreateSubjectResult> {
        const operationName = 'createSubject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getVocabulary(input: GetVocabularyInput, context?: Context): Promise<GetVocabularyResult> {
        const operationName = 'getVocabulary';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createVocabulary(input: CreateVocabularyInput, context?: Context): Promise<CreateVocabularyResult> {
        const operationName = 'createVocabulary';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createVocabularySet(input: CreateVocabularySetInput, context?: Context): Promise<CreateVocabularySetResult> {
        const operationName = 'createVocabularySet';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getWorkflow(input: GetWorkflowInput, context?: Context): Promise<GetWorkflowResult> {
        const operationName = 'getWorkflow';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAllUsers(input: GetAllUsersInput, context?: Context): Promise<GetAllUsersResult> {
        const operationName = 'getAllUsers';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    private async graphqlRequest({ query, variables, context, operationName }: GraphQLRequest): Promise<any> {
        const queryNode: DocumentNode = allQueries[operationName];
        const queryNodeString: string = print(queryNode);
        const source: string = query || queryNodeString;

        const contextValue = { ...context };
        const { data, errors } = await graphql({ schema, source, variableValues: variables, contextValue });

        if (errors && errors.length) {
            throw errors[0];
        }

        if (!data) {
            throw new Error(`Invalid query ${operationName}.`);
        }

        return data[operationName];
    }
}

export { GraphQLApi as default, allQueries };
