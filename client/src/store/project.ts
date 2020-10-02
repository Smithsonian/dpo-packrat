import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';

export type StateProject = {
    id: number;
    name: string;
    selected: boolean;
};

type ProjectStore = {
    projects: StateProject[];
    loading: boolean;
    getSelectedProject: () => StateProject | undefined;
    addProjects: (projects: StateProject[]) => void;
    updateSelectedProject: (id: number) => void;
    updateProject: (project: StateProject) => void;
    reset: () => void;
};

export const useProject = create<ProjectStore>((set: SetState<ProjectStore>, get: GetState<ProjectStore>) => ({
    projects: [],
    loading: false,
    getSelectedProject: () => {
        const { projects } = get();
        return lodash.find(projects, { selected: true });
    },
    addProjects: (fetchedProjects: StateProject[]) => {
        if (!fetchedProjects.length) return;
        set({ projects: fetchedProjects });
    },
    updateSelectedProject: (id: number): void => {
        const { projects, getSelectedProject, updateProject } = get();
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
    },
    updateProject: (project: StateProject): void => {
        const { projects } = get();

        const updatedProjects = (newProject: StateProject) =>
            lodash.map(projects, project => {
                if (project.id === newProject.id) {
                    return newProject;
                }
                return project;
            });

        set({ projects: updatedProjects(project) });
    },
    reset: () => {
        set({ projects: [], loading: false });
    }
}));
