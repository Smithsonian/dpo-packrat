import React, { createContext } from 'react';
import useIngestionContext, { Ingestion, IngestionDispatch } from './ingestion';

type AppContextType = {
    ingestion: Ingestion;
    ingestionDispatch: IngestionDispatch;
};

export const AppContext = createContext({} as AppContextType);

export const AppContextProvider = ({ children }: { children: React.ReactChild }): React.ReactElement => {
    const { ingestion, ingestionDispatch } = useIngestionContext();

    const value = {
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
