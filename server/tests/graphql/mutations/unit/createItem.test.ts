import { CreateUnitInput, CreateSubjectInput, CreateItemInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createItemTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number) => CreateSubjectInput;
    let createItemInput: (idSubject: number) => CreateItemInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
        createItemInput = utils.createItemInput;
    });

    describe('Mutation: createItem', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitArgs);

            if (Unit) {
                const subjectArgs: CreateSubjectInput = createSubjectInput(Unit.idUnit);
                const { Subject } = await graphQLApi.createSubject(subjectArgs);
                expect(Subject).toBeTruthy();

                if (Subject) {
                    const itemArgs: CreateItemInput = createItemInput(Subject.idSubject);
                    const { Item } = await graphQLApi.createItem(itemArgs);
                    expect(Item).toBeTruthy();
                }
            }
        });
    });
};

export default createItemTest;
