import create, { GetState, SetState } from 'zustand';

type RepositoryStore = {
    isExpanded: boolean;
    search: string;
    updateSearch: (value: string) => void;
    toggleFilter: () => void;
};

export const useRepositoryFilter = create<RepositoryStore>((set: SetState<RepositoryStore>, get: GetState<RepositoryStore>) => ({
    isExpanded: true,
    search: '',
    updateSearch: (value: string): void => {
        set({ search: value });
    },
    toggleFilter: (): void => {
        const { isExpanded } = get();
        set({ isExpanded: !isExpanded });
    }
}));
