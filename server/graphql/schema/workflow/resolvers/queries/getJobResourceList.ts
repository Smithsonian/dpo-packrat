import { GetJobResourceListResult, JobResource } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
// import * as DBAPI from '../../../../../db';

export default async function getJobResourceList(_: Parent): Promise<GetJobResourceListResult> {
    console.log('>>> getting list of job resources');

    // const Units = await DBAPI.Unit.fetchFromNameSearch();
    // if (!Units) {
    //     return {
    //         Units: []
    //     };
    // }
    const baseResource: JobResource = {
        name: '',
        type: 'na',
        address: '1.2.3.4',
        port: 1234,
        canInspect: true,
        canSceneGen: true,
        canPhotogrammetry: true,
        canBigFile: false,
    };
    const resources = [{ ...baseResource, name: 'test' }, { ...baseResource, name: 'test2' }];
    return { resources };
}