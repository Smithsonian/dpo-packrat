import { CreateUnitInput, CreateSubjectInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createSubjectTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Mutation: createSubject', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = {
                Name: 'Test Name',
                Abbreviation: 'Test Abbreviation',
                ARKPrefix: 'Test ARKPrefix'
            };

            const { Unit } = await graphQLApi.createUnit(unitArgs);
            expect(Unit).toBeTruthy();

            if (Unit) {
                const subjectArgs: CreateSubjectInput = {
                    idUnit: Unit.idUnit,
                    Name: 'Test Subject'
                };

                const { Subject } = await graphQLApi.createSubject(subjectArgs);
                expect(Subject).toBeTruthy();
            }
        });
    });
};

export default createSubjectTest;
