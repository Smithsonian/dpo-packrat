import create, { SetState } from 'zustand';

type RepositoryStore = {
    search: string;
    updateSearch: (value: string) => void;
};

export const useRepositoryFilter = create<RepositoryStore>((set: SetState<RepositoryStore>) => ({
    search: '',
    updateSearch: (value: string): void => {
        set({ search: value });
    }
}));
