/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLResolveInfo } from 'graphql';

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

export type Info = GraphQLResolveInfo;