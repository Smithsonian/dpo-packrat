import { CreateUnitInput, CreateSubjectInput, CreateItemInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createItemTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createItem', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = {
                Name: 'Test Name',
                Abbreviation: 'Test Abbreviation',
                ARKPrefix: 'Test ARKPrefix'
            };

            const { Unit } = await graphQLApi.createUnit(unitArgs);

            if (Unit) {
                const subjectArgs: CreateSubjectInput = {
                    idUnit: Unit.idUnit,
                    Name: 'Test Subject'
                };

                const { Subject } = await graphQLApi.createSubject(subjectArgs);
                expect(Subject).toBeTruthy();

                if (Subject) {
                    const itemArgs: CreateItemInput = {
                        idSubject: Subject.idSubject,
                        Name: 'Test Item',
                        EntireSubject: true
                    };

                    const { Item } = await graphQLApi.createItem(itemArgs);
                    expect(Item).toBeTruthy();
                }
            }
        });
    });
};

export default createItemTest;
