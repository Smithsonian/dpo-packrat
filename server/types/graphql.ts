export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
};

export type User = {
    __typename?: 'User';
    id: Scalars['ID'];
    name: Scalars['String'];
};

export type Query = {
    __typename?: 'Query';
    getUser: GetUserResult;
};


export type QueryGetUserArgs = {
    input: GetUserInput;
};

export type GetUserInput = {
    id: Scalars['ID'];
};

export type GetUserResult = {
    __typename?: 'GetUserResult';
    user?: Maybe<User>;
};
