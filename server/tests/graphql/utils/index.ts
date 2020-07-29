/**
 * TestSuiteUtils
 * This test suite utils helps with setting up jest environment
 * for testing graphql api
 */
import GraphQLApi from '../../../graphql';
import * as LOG from '../../../utils/logger';
import * as DBC from '../../../db/connection';
import * as path from 'path';
import {
    CreateUserInput,
    CreateVocabularySetInput,
    CreateVocabularyInput,
    CreateUnitInput,
    CreateSubjectInput,
    CreateItemInput,
    CreateProjectInput,
    CreateSceneInput,
    CreateModelInput,
    CreateCaptureDataInput,
    CreateCaptureDataPhotoInput
} from '../../../types/graphql';

class TestSuiteUtils {
    graphQLApi!: GraphQLApi;

    setupJest = (): void => {
        global.beforeAll(this.beforeAll);
        global.afterAll(this.afterAll);
    };

    private beforeAll = (): void => {
        const logPath: string = './logs';
        LOG.configureLogger(logPath);
        LOG.logger.info('**************************');
        LOG.logger.info('GraphQL Test Suite');
        LOG.logger.info(`GraphQL Tests writing logs to ${path.resolve(logPath)}`);

        this.graphQLApi = new GraphQLApi();
    };

    private afterAll = async (done: () => void): Promise<void> => {
        await DBC.DBConnection.disconnect();
        done();
    };

    createUserInput = (): CreateUserInput => {
        return {
            Name: 'Test User',
            EmailAddress: 'test@si.edu',
            SecurityID: 'SECURITY_ID'
        };
    };

    createVocabularyInput = (idVocabularySet: number): CreateVocabularyInput => {
        return {
            idVocabularySet,
            SortOrder: 0,
            Term: 'Test Vocabulary'
        };
    };

    createVocabularySetInput = (): CreateVocabularySetInput => {
        return {
            Name: 'Test Vocabulary Set',
            SystemMaintained: false
        };
    };

    createUnitInput = (): CreateUnitInput => {
        return {
            Name: 'Test Name',
            Abbreviation: 'Test Abbreviation',
            ARKPrefix: 'Test ARKPrefix'
        };
    };

    createSubjectInput = (idUnit: number): CreateSubjectInput => {
        return {
            idUnit,
            Name: 'Test Subject'
        };
    };

    createItemInput = (): CreateItemInput => {
        return {
            Name: 'Test Item',
            EntireSubject: true
        };
    };

    createProjectInput = (): CreateProjectInput => {
        return {
            Name: 'Test Name',
            Description: 'Test Description'
        };
    };

    createSceneInput = (): CreateSceneInput => {
        return {
            Name: 'Test Scene',
            HasBeenQCd: true,
            IsOriented: true
        };
    };

    createModelInput = (idVocabulary: number): CreateModelInput => {
        return {
            Authoritative: true,
            idVCreationMethod: idVocabulary,
            idVModality: idVocabulary,
            idVPurpose: idVocabulary,
            idVUnits: idVocabulary,
            Master: true
        };
    };

    createCaptureDataInput = (idVocabulary: number): CreateCaptureDataInput => {
        return {
            idVCaptureMethod: idVocabulary,
            DateCaptured: new Date(),
            Description: 'Test Description'
        };
    };

    createCaptureDataPhotoInput = (idCaptureData: number, idVocabulary: number): CreateCaptureDataPhotoInput => {
        return {
            idCaptureData,
            idVCaptureDatasetType: idVocabulary,
            CaptureDatasetFieldID: 0,
            ItemPositionFieldID: 0,
            ItemArrangementFieldID: 0,
            idVBackgroundRemovalMethod: idVocabulary,
            ClusterGeometryFieldID: 0,
            CameraSettingsUniform: true,
            idVItemPositionType: idVocabulary,
            idVFocusType: idVocabulary,
            idVLightSourceType: idVocabulary,
            idVClusterType: idVocabulary
        };
    };
}

export default TestSuiteUtils;
