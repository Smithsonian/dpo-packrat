import { StateProject, AppContext, IngestionDispatchAction, PROJECT_ACTIONS } from '../../../context';
import { useContext } from 'react';
import lodash from 'lodash';

interface UseProject {
    getSelectedProject: () => StateProject | undefined;
    addProjects: (projects: StateProject[]) => void;
    updateSelectedProject: (id: number) => void;
    updateProject: (project: StateProject) => void;
}

function useProject(): UseProject {
    const {
        ingestion: { projects },
        ingestionDispatch
    } = useContext(AppContext);

    const getSelectedProject = () => lodash.find(projects, { selected: true });

    const addProjects = (fetchedProjects: StateProject[]) => {
        if (!fetchedProjects.length) return;

        const addItemsAction: IngestionDispatchAction = {
            type: PROJECT_ACTIONS.ADD_PROJECTS,
            projects: fetchedProjects
        };

        ingestionDispatch(addItemsAction);
    };

    const updateSelectedProject = (id: number): void => {
        const project: StateProject | undefined = lodash.find(projects, { id });

        if (project) {
            const { selected } = project;
            if (!selected) {
                const alreadySelected: StateProject | undefined = getSelectedProject();

                if (alreadySelected) {
                    const unselectedProject = {
                        ...alreadySelected,
                        selected: false
                    };

                    updateProject(unselectedProject);
                }
                project.selected = true;
            }

            updateProject(project);
        }
    };

    const updateProject = (project: StateProject): void => {
        const updateProjectAction: IngestionDispatchAction = {
            type: PROJECT_ACTIONS.UPDATE_PROJECT,
            project
        };

        ingestionDispatch(updateProjectAction);
    };

    return {
        addProjects,
        updateProject,
        updateSelectedProject,
        getSelectedProject
    };
}

export default useProject;
