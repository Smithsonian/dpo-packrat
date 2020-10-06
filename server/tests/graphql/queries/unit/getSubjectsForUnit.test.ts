import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { CreateUnitInput, CreateSubjectInput } from '../../../../types/graphql';

const getSubjectsForUnitTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number) => CreateSubjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
    });

    describe('Query: getSubjectsForUnit', () => {
        test('should work with valid input', async () => {
            const unitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitInput);

            if (Unit) {
                const subjectInput = createSubjectInput(Unit.idUnit);
                const { Subject } = await graphQLApi.createSubject(subjectInput);
                expect(Subject).toBeTruthy();

                if (Subject) {
                    const input = {
                        idUnit: Unit.idUnit
                    };
                    const result = await graphQLApi.getSubjectsForUnit(input);
                    expect(result.Subject[0].idSubject).toBe(Subject?.idSubject);
                }
            }
        });
    });
};

export default getSubjectsForUnitTest;
