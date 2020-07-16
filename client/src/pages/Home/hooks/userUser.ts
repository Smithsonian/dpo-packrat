import { useQuery } from '@apollo/react-hooks';
import { QUERY_GET_USER } from '../../../graphql';

function userUser(idUser: number) {
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

export default userUser;
