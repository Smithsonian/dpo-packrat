import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { CreateUnitInput, CreateSubjectInput } from '../../../../types/graphql';

const getItemForSubjectTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number) => CreateSubjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
    });

    describe('Query: getItemForSubject', () => {
        test('should work with valid input', async () => {
            const unitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitInput);
            expect(Unit).toBeTruthy();

            if (Unit) {
                const subjectInput = createSubjectInput(Unit.idUnit);
                const { Subject } = await graphQLApi.createSubject(subjectInput);
                expect(Subject).toBeTruthy();

                if (Subject) {
                    const input = {
                        idSubject: Subject.idSubject
                    };
                    const { Item } = await graphQLApi.getItemsForSubject(input);
                    // A newly-created subject has no items yet.
                    expect(Array.isArray(Item)).toBe(true);
                    expect(Item.length).toBe(0);
                }
            }
        });
    });
};

export default getItemForSubjectTest;
