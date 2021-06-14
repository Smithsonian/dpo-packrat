import { apolloClient } from '../../../graphql';
import {
    GetUnitsFromNameSearchDocument,
} from '../../../types/graphql';

// export function useUnitList(): GetUnitsFromNameSearchQueryResult {
//     return useQuery(GetUnitsFromNameSearchDocument, { variables: { input: { search: '' } } });
// }

export async function getUnitsList() {
    return await apolloClient.query({
        query: GetUnitsFromNameSearchDocument,
        variables: {
            input: {
                search: ''
            }
        }
    });
}
