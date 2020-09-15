import { QueryGetBagitAssetsDetailsArgs, GetBagitAssetsDetailsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getBagitAssetsDetails(_: Parent, args: QueryGetBagitAssetsDetailsArgs): Promise<GetBagitAssetsDetailsResult> {
    const { idAssetVersion } = args.input;
    console.log('getBagitAssetsDetails', idAssetVersion);

    const photogrammetryData = {
        dateCaptured: new Date().toISOString(),
        datasetType: 18,
        description: 'sample bagit data description'
    };

    const identifier = {
        identifier: 'new identifier',
        identifierType: 76 // TODO: Ques: is identifier type needed?
    };

    return {
        BagitMetadata: [
            {
                name: 'Filename 1',
                type: 82, // Type (idVocabulary) can be photogrammetry, model etc
                folders: ['folder 1'],
                photogrammetryData,
                identifiers: [identifier]
            },
            {
                name: 'File name 2',
                type: 82,
                folders: ['folder 2'],
                photogrammetryData,
                identifiers: [identifier]
            }
        ]
    };
}
