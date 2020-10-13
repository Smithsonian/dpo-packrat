import create, { SetState, GetState } from 'zustand';
import { User, GetCurrentUserDocument } from '../types/graphql';
import { apolloClient } from '../graphql';
import { QueryOptions } from '@apollo/client';
import API, { AuthResponseType } from '../api';

type UserStore = {
    user: User | null;
    initialize: () => Promise<void>;
    login: (email: string, password: string) => Promise<AuthResponseType>;
    logout: () => Promise<AuthResponseType>;
};

export const useUserStore = create<UserStore>((set: SetState<UserStore>, get: GetState<UserStore>) => ({
    user: null,
    initialize: async () => {
        const { user } = get();
        if (!user) {
            const user = await getAuthenticatedUser();
            set({ user });
        }
    },
    login: async (email: string, password: string): Promise<AuthResponseType> => {
        const authResponse = await API.login(email, password);

        if (!authResponse.success) {
            return {
                ...authResponse,
                success: false
            };
        }

        const user = await getAuthenticatedUser();
        set({ user });

        return authResponse;
    },
    logout: async (): Promise<AuthResponseType> => {
        const authResponse = await API.logout();

        if (authResponse.success) {
            set({ user: null });
        }

        return authResponse;
    }
}));

async function getAuthenticatedUser(): Promise<User | null> {
    const queryOptions: QueryOptions = {
        query: GetCurrentUserDocument,
        fetchPolicy: 'network-only'
    };

    try {
        const { data } = await apolloClient.query(queryOptions);
        const { getCurrentUser } = data;

        return getCurrentUser.User;
    } catch {
        return null;
    }
}
