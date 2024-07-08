/**
 * TestSuiteUtils
 * This test suite utils helps with setting up jest environment
 * for testing graphql api
 */
import GraphQLApi from '../../../graphql';

import * as DBC from '../../../db/connection';
// import * as H from '../../../utils/helpers';
import {
    CreateUserInput,
    CreateVocabularySetInput,
    CreateVocabularyInput,
    CreateUnitInput,
    CreateSubjectInput,
    CreateProjectInput,
    CreateCaptureDataInput,
    CreateCaptureDataPhotoInput,
    VocabularyEntry,
    Vocabulary
} from '../../../types/graphql';
import { Asset, AssetVersion } from '@prisma/client';
import { randomStorageKey, nowCleansed } from '../../db/utils';
import * as COMMON from '@dpo-packrat/common';

class TestSuiteUtils {
    graphQLApi!: GraphQLApi;

    setupJest = (): void => {
        global.beforeAll(this.beforeAll);
        global.afterAll(this.afterAll);
    };

    private beforeAll = (): void => {
        this.graphQLApi = new GraphQLApi(true); // true -> use special flavor of GraphQL resolvers, which avoid explicit use of graphql-upload's GraphQLUpload resolver for "Upload" scalar; instead, use default Apollo resolver
    };

    private afterAll = async (done: () => void): Promise<void> => {
        // await H.Helpers.sleep(5000);
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
            Name: 'Test Unit Name',
            Abbreviation: 'Test Abbreviation',
            ARKPrefix: 'Test ARKPrefix'
        };
    };

    createSubjectInput = (idUnit: number, idIdentifierPreferred?: number): CreateSubjectInput => {
        return {
            idUnit,
            Name: 'Test Subject',
            idIdentifierPreferred: idIdentifierPreferred || null
        };
    };

    createProjectInput = (): CreateProjectInput => {
        return {
            Name: 'Test Name',
            Unit: 1,
            Description: 'Test Description'
        };
    };

    createCaptureDataInput = (idVocabulary: number): CreateCaptureDataInput => {
        return {
            Name: 'Test Name',
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
            idVClusterType: idVocabulary,
            CaptureDatasetUse: '[]',
        };
    };

    createAssetInput = (idVAssetType: number): Asset => {
        return {
            FileName: 'Test Asset Thumbnail',
            idSystemObject: null,
            idAssetGroup: null,
            idVAssetType,
            StorageKey: randomStorageKey('/test/asset/path/'),
            idAsset: 0
        };
    };

    createAssetVersionInput = (idAsset: number, idUser: number): AssetVersion => {
        return {
            idAsset,
            FileName: 'Test file',
            idUserCreator: idUser,
            DateCreated: nowCleansed(),
            StorageHash: 'Asset Checksum',
            StorageKeyStaging: '',
            StorageSize: BigInt(50),
            idAssetVersion: 0,
            Ingested: false,
            BulkIngest: false,
            idSOAttachment: null,
            FilePath: '/test/asset/path',
            Comment: 'Test file',
            Version: 0
        };
    };

    getVocabularyEntryMap = (vocabularyEntries: VocabularyEntry[]): Map<number, Vocabulary[]> => {
        const vocabularyMap = new Map<number, Vocabulary[]>();

        vocabularyEntries.forEach(({ eVocabSetID, Vocabulary }) => {
            vocabularyMap.set(eVocabSetID, Vocabulary);
        });

        return vocabularyMap;
    };

    getInitialEntryWithVocabularies = (vocabularies: Map<number, Vocabulary[]>, eVocabularyID: COMMON.eVocabularySetID): number | null => {
        const vocabularyEntry = vocabularies.get(eVocabularyID);

        if (vocabularyEntry) {
            return vocabularyEntry[0].idVocabulary;
        }

        return null;
    };
}

export default TestSuiteUtils;
