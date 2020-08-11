import React, { useState, createContext } from 'react';
import { User } from '../types/graphql';
import useIngestionContext, { Ingestion, IngestionDispatch } from './ingestion';

type AppContextType = {
    user: User | null;
    updateUser: (user: User | null) => void;
    ingestion: Ingestion;
    ingestionDispatch: IngestionDispatch;
};

export const AppContext = createContext({} as AppContextType);

export const AppContextProvider = ({ children }: { children: React.ReactChild }): React.ReactElement => {
    const [user, setUser] = useState<User | null>(null);
    const { ingestion, ingestionDispatch } = useIngestionContext();

    const updateUser = (user: User | null) => {
        setUser(user);
    };

    const value = {
        user,
        updateUser,
        ingestion,
        ingestionDispatch
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export * from './ingestion';
export * from './ingestion.defaults';
export * from './utils';
