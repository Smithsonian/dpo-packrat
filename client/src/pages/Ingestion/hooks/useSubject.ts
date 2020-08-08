import { StateSubject, AppContext, IngestionDispatchAction, SUBJECT_ACTIONS, StateItem, StateProject } from '../../../context';
import { parseItemToState, parseProjectToState } from '../../../context/utils';
import { useContext } from 'react';
import lodash from 'lodash';
import { toast } from 'react-toastify';
import useItem from './useItem';
import useProject from './useProject';
import { apolloClient, QUERY_GET_INGESTION_ITEMS_FOR_SUBJECT, QUERY_GET_INGESTION_PROJECTS_FOR_SUBJECT } from '../../../graphql';
import { Item, Project } from '../../../types/graphql';

interface UseSubject {
    addSubject: (subject: StateSubject) => Promise<void>;
    removeSubject: (id: number) => void;
}

function useSubject(): UseSubject {
    const {
        ingestion: { subjects },
        ingestionDispatch
    } = useContext(AppContext);

    const { addItems } = useItem();
    const { addProjects } = useProject();

    const addSubject = async (subject: StateSubject): Promise<void> => {
        const alreadyExists = !!lodash.find(subjects, { id: subject.id });

        if (!alreadyExists) {
            const addSubjectAction: IngestionDispatchAction = {
                type: SUBJECT_ACTIONS.ADD_SUBJECT,
                subject
            };

            ingestionDispatch(addSubjectAction);

            const selectedSubjects = [...subjects, subject];
            updateProjectsAndItemsForSubjects(selectedSubjects, addItems, addProjects);
        } else {
            toast.info(`Subject ${subject.name} has already been added`);
        }
    };

    const removeSubject = (id: number) => {
        const removeSubjectAction: IngestionDispatchAction = {
            type: SUBJECT_ACTIONS.REMOVE_SUBJECT,
            id
        };

        ingestionDispatch(removeSubjectAction);

        const selectedSubjects = lodash.filter(subjects, subject => subject.id !== id);
        updateProjectsAndItemsForSubjects(selectedSubjects, addItems, addProjects);
    };

    return {
        addSubject,
        removeSubject
    };
}

async function updateProjectsAndItemsForSubjects(selectedSubjects: StateSubject[], addItems, addProjects): Promise<void> {
    if (!selectedSubjects.length) {
        addItems([]);
        addProjects([]);
        return;
    }

    const idSubjects = selectedSubjects.map(({ id }) => id);

    const variables = {
        input: {
            idSubjects
        }
    };

    // TODO: remove mock as queries are integrated fully

    try {
        const {
            data: { getIngestionItemsForSubjects }
        } = await apolloClient.query({ query: QUERY_GET_INGESTION_ITEMS_FOR_SUBJECT, variables });
        const { Item: foundItems } = getIngestionItemsForSubjects;

        const items: StateItem[] = foundItems.map((item: Item) => parseItemToState(item, false));

        const mockItem: StateItem = {
            id: String(1),
            name: 'Geonimo 238 Thorax',
            selected: false,
            entireSubject: false
        };

        addItems([...items, mockItem]);
    } catch (error) {
        toast.error('Failed to get items for subjects');
    }

    try {
        const {
            data: { getIngestionProjectsForSubjects }
        } = await apolloClient.query({ query: QUERY_GET_INGESTION_PROJECTS_FOR_SUBJECT, variables });

        const { Project: foundProjects } = getIngestionProjectsForSubjects;

        const projects: StateProject[] = foundProjects.map((project: Project) => parseProjectToState(project, false));

        const mockProject: StateProject = {
            id: 1,
            name: 'Mammoth (NMNH)',
            selected: true
        };

        addProjects([...projects, mockProject]);
    } catch (error) {
        toast.error('Failed to get projects for subjects');
    }
}

export default useSubject;
