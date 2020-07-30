/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
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
    CreateVocabularySetResult
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
    createVocabularySet
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

    async getUnit(input: GetUnitInput, context?: Context): Promise<GetUnitResult> {
        const operationName = 'getUnit';
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

    private async graphqlRequest({ query, variables, context, operationName }: GraphQLRequest): Promise<Object> {
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
