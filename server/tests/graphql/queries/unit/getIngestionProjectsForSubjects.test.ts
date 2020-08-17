import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { CreateUnitInput, CreateSubjectInput } from '../../../../types/graphql';

const getIngestionProjectsForSubjectsTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUnitInput: () => CreateUnitInput;
    let createSubjectInput: (idUnit: number) => CreateSubjectInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUnitInput = utils.createUnitInput;
        createSubjectInput = utils.createSubjectInput;
    });

    describe('Query: getIngestionProjectsForSubjects', () => {
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
                    const { Project } = await graphQLApi.getIngestionProjectsForSubjects(input);
                    expect(Project).toBeTruthy();
                }
            }
        });
    });
};

export default getIngestionProjectsForSubjectsTest;
