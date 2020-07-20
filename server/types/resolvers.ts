/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLResolveInfo } from 'graphql';
import { User } from './graphql';

type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
};

export type Parent = {
    id: Scalars['ID'];
} | any;

export type Args = { input?: any };

export type Context = { 
    user: User | undefined,
    isAuthenticated: boolean
};

export type Info = GraphQLResolveInfo;