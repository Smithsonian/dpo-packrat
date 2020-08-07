import { Project, AppContext, IngestionDispatchAction, PROJECT_ACTIONS } from '../../../context';
import { useContext } from 'react';
import lodash from 'lodash';

interface UseProject {
    getSelectedProject: () => Project | undefined;
    addProjects: (projects: Project[]) => void;
    updateSelectedProject: (id: number) => void;
    updateProject: (project: Project) => void;
}

function useProject(): UseProject {
    const {
        ingestion: { projects },
        ingestionDispatch
    } = useContext(AppContext);

    const getSelectedProject = () => lodash.find(projects, { selected: true });

    const addProjects = (fetchedProjects: Project[]) => {
        const newProjects: Project[] = [];

        fetchedProjects.forEach((project: Project) => {
            const { id } = project;
            const alreadyExists = !!lodash.find(projects, { id });

            if (!alreadyExists) {
                newProjects.push(project);
            }
        });

        const addItemsAction: IngestionDispatchAction = {
            type: PROJECT_ACTIONS.ADD_PROJECTS,
            projects: newProjects
        };

        ingestionDispatch(addItemsAction);
    };

    const updateSelectedProject = (id: number): void => {
        const project: Project | undefined = lodash.find(projects, { id });

        if (project) {
            const { selected } = project;
            if (selected) {
                const alreadySelected: Project | undefined = getSelectedProject();

                if (alreadySelected) {
                    const unselectedProject = {
                        ...alreadySelected,
                        selected: false
                    };

                    updateProject(unselectedProject);
                }
            }

            updateProject(project);
        }
    };

    const updateProject = (project: Project): void => {
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
