import React, { useState, createContext, } from 'react';
import { User } from '../types/graphql';

type AppContextType = {
    user: User | null,
    updateUser: (user: User | null) => void
};

export const AppContext = createContext({} as AppContextType);

export const AppContextProvider = ({ children }: { children: React.ReactChild }): React.ReactElement => {
    const [user, setUser] = useState<User | null>(null);

    const updateUser = (user: User | null) => {
        setUser(user);
    };

    const value = {
        user,
        updateUser
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};