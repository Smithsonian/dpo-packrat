import { QueryGetContentsForAssetVersionsArgs, GetContentsForAssetVersionsResult, AssetVersionContent } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

const mockContent = {
    folders: ['raw', 'camera', 'processed'],
    all: ['raw/p1.jpg', 'raw/p2.jpg', 'camera/p1.jpg', 'camera/p2.jpg', 'processed/p1.jpg', 'processed/p2.jpg']
};

// TODO: update this to not use mockContent
export default async function getContentsForAssetVersions(_: Parent, args: QueryGetContentsForAssetVersionsArgs, context: Context): Promise<GetContentsForAssetVersionsResult> {
    const { user } = context;

    if (!user) {
        return { AssetVersionContent: [] };
    }

    const { idAssetVersions } = args.input;

    const result: AssetVersionContent[] = [];

    idAssetVersions.forEach(idAssetVersion => {
        const content = {
            idAssetVersion,
            ...mockContent
        };

        result.push(content);
    });

    return { AssetVersionContent: result };
}
