import * as DBAPI from '../../../../db';
import GraphQLApi from '../../../../graphql';
import {
    CreateSubjectInput,
    CreateUnitInput,
    CreateVocabularyInput,
    CreateVocabularySetInput,
    GetSystemObjectDetailsInput,
    GetSystemObjectDetailsResult
} from '../../../../types/graphql';
import * as UTIL from '../../../db/api';
import TestSuiteUtils from '../../utils';

const getSystemObjectDetailsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number, idIdentifierPreferred?: number) => CreateSubjectInput;
    let createVocabularyInput: (idVocabularySet: number) => CreateVocabularyInput;
    let createVocabularySetInput: () => CreateVocabularySetInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
        createVocabularyInput = utils.createVocabularyInput;
        createVocabularySetInput = utils.createVocabularySetInput;
    });

    describe('Query: getSystemObjectDetails', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitArgs);
            expect(Unit).toBeTruthy();

            const vocabularySetArgs: CreateVocabularySetInput = createVocabularySetInput();
            const { VocabularySet } = await graphQLApi.createVocabularySet(vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet && Unit) {
                const vocabularyArgs: CreateVocabularyInput = createVocabularyInput(VocabularySet.idVocabularySet);
                const { Vocabulary } = await graphQLApi.createVocabulary(vocabularyArgs);
                expect(Vocabulary).toBeTruthy();

                if (Vocabulary) {
                    const IdentifierValue: string = 'Test Identifier Null 2';
                    const Identifier = await UTIL.createIdentifierTest({
                        IdentifierValue,
                        idVIdentifierType: Vocabulary.idVocabulary,
                        idSystemObject: null,
                        idIdentifier: 0
                    });

                    if (Identifier) {
                        const subjectArgs: CreateSubjectInput = createSubjectInput(Unit.idUnit, Identifier.idIdentifier);
                        const { Subject } = await graphQLApi.createSubject(subjectArgs);
                        expect(Subject).toBeTruthy();

                        if (Subject) {
                            const SO = await DBAPI.SystemObject.fetchFromSubjectID(Subject.idSubject);

                            if (SO) {
                                Identifier.idSystemObject = SO.idSystemObject;
                                await Identifier.update();

                                const input: GetSystemObjectDetailsInput = {
                                    idSystemObject: SO.idSystemObject
                                };

                                const { name, identifiers, objectAncestors, sourceObjects, derivedObjects, objectVersions }: GetSystemObjectDetailsResult = await graphQLApi.getSystemObjectDetails(input);
                                const [{ identifier }] = identifiers;

                                expect(name).toBe(subjectArgs.Name);
                                expect(identifier).toBe(IdentifierValue);
                                expect(objectAncestors).toBeTruthy();
                                expect(sourceObjects).toBeTruthy();
                                expect(derivedObjects).toBeTruthy();
                                expect(objectVersions).toBeTruthy();
                            }
                        }
                    }
                }
            }
        });

        test('should fail with invalid input', async () => {
            const input: GetSystemObjectDetailsInput = {
                idSystemObject: 0
            };

            await expect(graphQLApi.getSystemObjectDetails(input)).rejects.toThrow();
        });
    });
};

export default getSystemObjectDetailsTest;
