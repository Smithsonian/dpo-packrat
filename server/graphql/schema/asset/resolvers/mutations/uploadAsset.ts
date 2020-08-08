import { MutationUploadAssetArgs, UploadAssetResult, UploadStatus } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { ReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function uploadAsset(_: Parent, args: MutationUploadAssetArgs): Promise<UploadAssetResult | void> {
    const { filename, createReadStream }: ApolloFile = await args.file;

    const fileStream = createReadStream();

    const path = join('uploads/');

    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }

    const stream = fileStream.pipe(createWriteStream(`${path}/${filename}`));

    return new Promise(resolve => {
        fileStream.on('error', () => {
            stream.emit('error');
        });

        stream.on('finish', () => {
            resolve({ status: UploadStatus.Complete });
        });

        stream.on('error', () => {
            resolve({ status: UploadStatus.Failed });
        });

        stream.on('close', () => {
            stream.close();
            // TODO: create asset + asset version
        });
    });
}
