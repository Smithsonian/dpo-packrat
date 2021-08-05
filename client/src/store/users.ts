/* eslint-disable camelcase */
import create, { GetState, SetState } from 'zustand';
import { apolloClient } from '../graphql';
import { GetAllUsersDocument, User_Status, User } from '../types/graphql';
import { FilterOption } from '../pages/Workflow/components/WorkflowFilterOptions';

type UsersStore = {
    users: Map<number, User>;
    updateUsersEntries: () => Promise<void>;
    getUsersList: () => User[];
    getUsersFilterOptions: () => FilterOption[];
};

export const useUsersStore = create<UsersStore>((set: SetState<UsersStore>, get: GetState<UsersStore>) => ({
    users: new Map<number, User>(),
    updateUsersEntries: async (): Promise<void> => {
        const { data } = await apolloClient.query({
            query: GetAllUsersDocument,
            variables: {
                input: {
                    active: User_Status.EAll,
                    search: ''
                }
            }
        });
        const {
            getAllUsers: { User: queriedUsers }
        } = data;
        const userMap = new Map();
        queriedUsers.forEach(user => {
            userMap.set(user.idUser, user);
        });
        set({ users: userMap });
        return;
    },
    getUsersList: (): User[] => {
        const { users } = get();
        return Array.from(users.values());
    },
    getUsersFilterOptions: (): FilterOption[] => {
        const { getUsersList } = get();
        return getUsersList().map(user => {
            return {
                label: user.Name,
                value: user.idUser
            };
        });
    }
}));
