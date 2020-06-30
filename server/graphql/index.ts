/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/**
 * GraphQLApi
 * This helps with seamless access to our graphql api enabling
 * us to use it in a non-graphql context such as custom REST
 * routes and testing environment
 */
import { Context } from '../types/resolvers';
import schema from './schema';
import { allQueries } from './api';
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
} from '../types/graphql';

type GraphQLApiArgs = {
    context: Context;
};

type GraphQLRequest = {
    query?: string;
    variables: any;
    context?: Context | Object;
    operationName: string;
};

class GraphQLApi {
    private context: Context;

    constructor({ context }: GraphQLApiArgs) {
        this.context = context;
    }

    async getUser(input: GetUserInput, context?: Context | Object): Promise<GetUserResult> {
        const operationName = 'getUser';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createUser(input: CreateUserInput, context?: Context | Object): Promise<CreateUserResult> {
        const operationName = 'createUser';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAccessPolicy(input: GetAccessPolicyInput, context?: Context | Object): Promise<GetAccessPolicyResult> {
        const operationName = 'getAccessPolicy';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getAsset(input: GetAssetInput, context?: Context | Object): Promise<GetAssetResult> {
        const operationName = 'getAsset';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getCaptureData(input: GetCaptureDataInput, context?: Context | Object): Promise<GetCaptureDataResult> {
        const operationName = 'getCaptureData';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createCaptureData(input: CreateCaptureDataInput, context?: Context | Object): Promise<CreateCaptureDataResult> {
        const operationName = 'createCaptureData';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getLicense(input: GetLicenseInput, context?: Context | Object): Promise<GetLicenseResult> {
        const operationName = 'getLicense';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getModel(input: GetModelInput, context?: Context | Object): Promise<GetModelResult> {
        const operationName = 'getModel';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createModel(input: CreateModelInput, context?: Context | Object): Promise<CreateModelResult> {
        const operationName = 'createModel';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getScene(input: GetSceneInput, context?: Context | Object): Promise<GetSceneResult> {
        const operationName = 'getScene';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createScene(input: CreateSceneInput, context?: Context | Object): Promise<CreateSceneResult> {
        const operationName = 'createScene';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getUnit(input: GetUnitInput, context?: Context | Object): Promise<GetUnitResult> {
        const operationName = 'getUnit';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createUnit(input: CreateUnitInput, context?: Context | Object): Promise<CreateUnitResult> {
        const operationName = 'createUnit';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getProject(input: GetProjectInput, context?: Context | Object): Promise<GetProjectResult> {
        const operationName = 'getProject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createProject(input: CreateProjectInput, context?: Context | Object): Promise<CreateProjectResult> {
        const operationName = 'createProject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getItem(input: GetItemInput, context?: Context | Object): Promise<GetItemResult> {
        const operationName = 'getItem';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createItem(input: CreateItemInput, context?: Context | Object): Promise<CreateItemResult> {
        const operationName = 'createItem';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getSubject(input: GetSubjectInput, context?: Context | Object): Promise<GetSubjectResult> {
        const operationName = 'getSubject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createSubject(input: CreateSubjectInput, context?: Context | Object): Promise<CreateSubjectResult> {
        const operationName = 'createSubject';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getVocabulary(input: GetVocabularyInput, context?: Context | Object): Promise<GetVocabularyResult> {
        const operationName = 'getVocabulary';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createVocabulary(input: CreateVocabularyInput, context?: Context | Object): Promise<CreateVocabularyResult> {
        const operationName = 'createVocabulary';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async createVocabularySet(input: CreateVocabularySetInput, context?: Context | Object): Promise<CreateVocabularySetResult> {
        const operationName = 'createVocabularySet';
        const variables = { input };
        return this.graphqlRequest({
            operationName,
            variables,
            context
        });
    }

    async getWorkflow(input: GetWorkflowInput, context?: Context | Object): Promise<GetWorkflowResult> {
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

        const contextValue = (context = context ? { ...this.context, ...context } : this.context);
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

export { GraphQLApi as default, schema };
