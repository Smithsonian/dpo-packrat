import { CreateUnitInput, CreateSubjectInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';

const createSubjectTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number) => CreateSubjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
    });

    describe('Mutation: createSubject', () => {
        test('should work with valid input', async () => {
            const unitArgs: CreateUnitInput = createUnitInput();
            const { Unit } = await graphQLApi.createUnit(unitArgs);
            expect(Unit).toBeTruthy();

            if (Unit) {
                const subjectArgs: CreateSubjectInput = createSubjectInput(Unit.idUnit);
                const { Subject } = await graphQLApi.createSubject(subjectArgs);
                expect(Subject).toBeTruthy();
            }
        });
    });
};

export default createSubjectTest;
