import { MutationCaptureDataUploadArgs, CaptureDataUploadResult, UploadStatus } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { ReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function captureDataUpload(_: Parent, args: MutationCaptureDataUploadArgs): Promise<CaptureDataUploadResult | void> {
    const { filename, createReadStream }: ApolloFile = await args.file;

    const fileStream = createReadStream();

    const path = join('uploads/');

    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }

    const stream = fileStream.pipe(createWriteStream(`${path}/${filename}`));

    return new Promise(resolve => {
        stream.on('finish', () => {
            resolve({ status: UploadStatus.Success });
        });

        stream.on('error', () => {
            resolve({ status: UploadStatus.Failed });
        });

        stream.on('close', () => {
            stream.close();
        });
    });
}
