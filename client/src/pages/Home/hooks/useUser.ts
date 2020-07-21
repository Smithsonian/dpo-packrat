/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@apollo/react-hooks';
import { QUERY_GET_USER } from '../../../graphql';
import { ApolloError } from 'apollo-boost';

function useUser(idUser: number): { userData: any, userLoading: boolean, userError: ApolloError | undefined } {
    const variables = {
        input: {
            idUser
        }
    };

    const { data: userData, loading: userLoading, error: userError } = useQuery(QUERY_GET_USER, { variables });

    return {
        userData,
        userLoading,
        userError
    };
}

export default useUser;
