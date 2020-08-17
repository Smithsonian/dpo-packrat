import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { CreateUnitInput, CreateSubjectInput } from '../../../../types/graphql';

const getIngestionItemsForSubjectsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number) => CreateSubjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
    });

    describe('Query: getIngestionItemsForSubjects', () => {
        test('should work with valid input', async () => {
            const unitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitInput);

            if (Unit) {
                const subjectInput = createSubjectInput(Unit.idUnit);
                const { Subject } = await graphQLApi.createSubject(subjectInput);

                if (Subject) {
                    const input = {
                        idSubjects: [Subject.idSubject]
                    };
                    const { Item } = await graphQLApi.getIngestionItemsForSubjects(input);
                    expect(Item).toBeTruthy();
                }
            }
        });
    });
};

export default getIngestionItemsForSubjectsTest;
