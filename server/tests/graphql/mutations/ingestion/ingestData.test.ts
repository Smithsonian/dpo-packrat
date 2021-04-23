import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import {
    IngestItemInput,
    IngestProjectInput,
    IngestSubjectInput,
    IngestPhotogrammetry,
    IngestIdentifier,
    IngestFolder,
    Vocabulary,
    VocabularyEntry,
    AreCameraSettingsUniformInput,
    CreateUserInput,
    GetContentsForAssetVersionsInput,
    CreateVocabularyInput,
    CreateVocabularySetInput
} from '../../../../types/graphql';
import { Context } from '../../../../types/resolvers';
import { eVocabularySetID } from '../../../../cache';
import { Asset, AssetVersion } from '@prisma/client';
import * as DBAPI from '../../../../db';

const ingestDataTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createAssetInput: (idVAssetType: number) => Asset;
    let createUserInput: () => CreateUserInput;
    let getVocabularyEntryMap: (vocabularyEntries: VocabularyEntry[]) => Map<number, Vocabulary[]>;
    let getInitialEntryWithVocabularies: (vocabularies: Map<number, Vocabulary[]>, eVocabularySetID: eVocabularySetID) => number | null;
    let createAssetVersionInput: (idAsset: number, idUser: number) => AssetVersion;
    let createVocabularyInput: (idVocabularySet: number) => CreateVocabularyInput;
    let createVocabularySetInput: () => CreateVocabularySetInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
        createAssetInput = utils.createAssetInput;
        getVocabularyEntryMap = utils.getVocabularyEntryMap;
        getInitialEntryWithVocabularies = utils.getInitialEntryWithVocabularies;
        createAssetVersionInput = utils.createAssetVersionInput;
        createVocabularyInput = utils.createVocabularyInput;
        createVocabularySetInput = utils.createVocabularySetInput;
    });

    describe('Mutation: ingestData', () => {
        jest.setTimeout(60000);
        test('should work with valid input', async done => {
            const vocabularySetArgs: CreateVocabularySetInput = createVocabularySetInput();
            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet) {
                const vocabularyArgs: CreateVocabularyInput = createVocabularyInput(VocabularySet.idVocabularySet);
                const { Vocabulary } = await graphQLApi.createVocabulary(vocabularyArgs);
                expect(Vocabulary).toBeTruthy();

                if (Vocabulary) {
                    const assetInput = createAssetInput(Vocabulary.idVocabulary);
                    const asset = new DBAPI.Asset(assetInput);

                    const created = await asset.create();
                    expect(created).toBe(true);

                    const userInput = createUserInput();
                    const { User } = await graphQLApi.createUser(userInput);

                    if (User) {
                        const context: Context = {
                            user: User,
                            isAuthenticated: true
                        };

                        const assetVersionInput = createAssetVersionInput(asset.idAsset, User.idUser);
                        const assetVersion = new DBAPI.AssetVersion(assetVersionInput);

                        const searchInput = {
                            query: 'apollo'
                        };

                        const { SubjectUnitIdentifier } = await graphQLApi.searchIngestionSubjects(searchInput);
                        expect(SubjectUnitIdentifier).toBeTruthy();

                        if (!SubjectUnitIdentifier.length) done();

                        const { idSubject, SubjectName, IdentifierPublic, UnitAbbreviation } = SubjectUnitIdentifier[0];

                        const subject: IngestSubjectInput = {
                            id: idSubject,
                            name: SubjectName,
                            arkId: IdentifierPublic || '',
                            unit: UnitAbbreviation
                        };

                        const projectsInput = {
                            idSubjects: [idSubject]
                        };
                        const { Project } = await graphQLApi.getIngestionProjectsForSubjects(projectsInput);
                        expect(Project).toBeTruthy();

                        const { idProject, Name } = Project[0];

                        const project: IngestProjectInput = {
                            id: idProject,
                            name: Name
                        };

                        const item: IngestItemInput = {
                            id: null,
                            name: 'custom item',
                            entireSubject: true
                        };

                        const vocabularyEntriesInput = {
                            eVocabSetIDs: [eVocabularySetID.eCaptureDataDatasetType, eVocabularySetID.eIdentifierIdentifierType, eVocabularySetID.eCaptureDataFileVariantType]
                        };

                        const { VocabularyEntries } = await graphQLApi.getVocabularyEntries(vocabularyEntriesInput);

                        const vocabularyMap = getVocabularyEntryMap(VocabularyEntries);

                        const identifierType = getInitialEntryWithVocabularies(vocabularyMap, eVocabularySetID.eIdentifierIdentifierType) || 0;
                        const variantType = getInitialEntryWithVocabularies(vocabularyMap, eVocabularySetID.eCaptureDataFileVariantType) || 0;
                        const datasetType = getInitialEntryWithVocabularies(vocabularyMap, eVocabularySetID.eCaptureDataDatasetType) || 0;

                        const identifier: IngestIdentifier = {
                            identifier: 'ark:/65665/p2b-a6ae6ff4-89a5-44b3-9edc-09728f884076',
                            identifierType,
                            idIdentifier: 0
                        };

                        const getContentsInput: GetContentsForAssetVersionsInput = {
                            idAssetVersions: [assetVersion.idAssetVersion]
                        };

                        const { AssetVersionContent } = await graphQLApi.getContentsForAssetVersions(getContentsInput);
                        expect(AssetVersionContent).toBeTruthy();

                        let folderName = 'raw';

                        if (AssetVersionContent) {
                            const [assetVersionContent] = AssetVersionContent;
                            if (assetVersionContent) {
                                folderName = assetVersionContent.folders[0];
                            }
                        }

                        const folder: IngestFolder = {
                            name: folderName,
                            variantType
                        };

                        const cameraSettingUniformInput: AreCameraSettingsUniformInput = {
                            idAssetVersion: assetVersion.idAssetVersion
                        };

                        const { isUniform } = await graphQLApi.areCameraSettingsUniform(cameraSettingUniformInput);

                        const photogrammetry: IngestPhotogrammetry = {
                            idAssetVersion: assetVersion.idAssetVersion,
                            name: 'capture data name',
                            dateCaptured: new Date().toISOString(),
                            datasetType,
                            systemCreated: true,
                            description: 'some description',
                            cameraSettingUniform: isUniform,
                            datasetFieldId: null,
                            itemPositionType: null,
                            itemPositionFieldId: null,
                            itemArrangementFieldId: null,
                            focusType: null,
                            lightsourceType: null,
                            backgroundRemovalMethod: null,
                            clusterType: null,
                            clusterGeometryFieldId: null,
                            directory: '',
                            identifiers: [identifier],
                            folders: [folder],
                        };

                        const ingestDataInput = {
                            subjects: [subject],
                            project,
                            item,
                            photogrammetry: [photogrammetry],
                            model: [],
                            scene: [],
                            other: []
                        };

                        const result = await graphQLApi.ingestData(ingestDataInput, context);
                        expect(result.success).toBe(true);
                        done();
                    }
                }
            }
        });
    });
};

export default ingestDataTest;
