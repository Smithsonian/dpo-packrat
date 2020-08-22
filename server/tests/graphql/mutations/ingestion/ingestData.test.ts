import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import {
    IngestItem,
    IngestProject,
    IngestSubject,
    PhotogrammetryIngest,
    IngestIdentifier,
    IngestFolder,
    Vocabulary,
    VocabularyEntry,
    AreCameraSettingsUniformInput,
    CreateUserInput,
    GetContentsForAssetVersionsInput
} from '../../../../types/graphql';
import { eVocabularySetID } from '../../../../cache';
import { Asset, AssetVersion } from '@prisma/client';
import * as DBAPI from '../../../../db';

const ingestDataTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createAssetInput: () => Asset;
    let createUserInput: () => CreateUserInput;
    let getVocabularyEntryMap: (vocabularyEntries: VocabularyEntry[]) => Map<number, Vocabulary[]>;
    let getInitialEntryWithVocabularies: (vocabularies: Map<number, Vocabulary[]>, eVocabularySetID: eVocabularySetID) => number | null;
    let createAssetVersionInput: (idAsset: number, idUser: number) => AssetVersion;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
        createAssetInput = utils.createAssetInput;
        getVocabularyEntryMap = utils.getVocabularyEntryMap;
        getInitialEntryWithVocabularies = utils.getInitialEntryWithVocabularies;
        createAssetVersionInput = utils.createAssetVersionInput;
    });

    describe('Mutation: ingestData', () => {
        test('should work with valid input', async done => {
            const assetInput = createAssetInput();
            const asset = new DBAPI.Asset(assetInput);
            // TODO: KARAN: fix this test
            // const created = await asset.create();
            // expect(created).toBe(true);

            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            if (User) {
                const assetVersionInput = createAssetVersionInput(asset.idAsset, User.idUser);
                const assetVersion = new DBAPI.AssetVersion(assetVersionInput);

                const searchInput = {
                    query: 'apollo'
                };

                const { SubjectUnitIdentifier } = await graphQLApi.searchIngestionSubjects(searchInput);
                expect(SubjectUnitIdentifier).toBeTruthy();

                if (!SubjectUnitIdentifier.length) done();

                const { idSubject, SubjectName, IdentifierPublic, UnitAbbreviation } = SubjectUnitIdentifier[0];

                const subject: IngestSubject = {
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

                const project: IngestProject = {
                    id: idProject,
                    name: Name
                };

                const item: IngestItem = {
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
                    id: assetVersion.idAssetVersion,
                    identifier: 'custom-identifier',
                    identifierType
                };

                const getContentsInput: GetContentsForAssetVersionsInput = {
                    idAssetVersions: [assetVersion.idAsset]
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

                const photogrammetry: PhotogrammetryIngest = {
                    idAssetVersion: assetVersion.idAssetVersion,
                    dateCaptured: new Date().toISOString(),
                    datasetType,
                    systemCreated: true,
                    description: 'some description',
                    cameraSettingUniform: isUniform,
                    identifiers: [identifier],
                    folders: [folder],
                    datasetFieldId: null,
                    itemPositionType: null,
                    itemPositionFieldId: null,
                    itemArrangementFieldId: null,
                    focusType: null,
                    lightsourceType: null,
                    backgroundRemovalMethod: null,
                    clusterType: null,
                    clusterGeometryFieldId: null
                };

                const ingestDataInput = {
                    subjects: [subject],
                    project,
                    item,
                    photogrammetry: [photogrammetry]
                };

                const result = await graphQLApi.ingestData(ingestDataInput);
                expect(result.success).toBe(true);
            }
        });
    });
};

export default ingestDataTest;
