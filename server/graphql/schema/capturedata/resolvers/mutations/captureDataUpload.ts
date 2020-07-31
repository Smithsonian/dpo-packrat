import { MutationCaptureDataUploadArgs, CaptureDataUploadResult, UploadStatus } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { ReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';

interface ApolloFile {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => ReadStream;
}

export default async function captureDataUpload(_: Parent, args: MutationCaptureDataUploadArgs, context: Context): Promise<CaptureDataUploadResult | void> {
    const { user } = context;

    if (!user) {
        return {
            status: UploadStatus.Failed
        };
    }

    const { filename, createReadStream }: ApolloFile = await args.file;

    const fileStream = createReadStream();

    const { idUser } = user;

    const path = `./uploads/${idUser}`;

    if (!existsSync(path)) {
        mkdirSync(path);
    }

    const stream = fileStream.pipe(createWriteStream(`${path}/${filename}`));

    return new Promise(resolve => {
        stream.on('finish', () => {
            console.log('Finished');
            resolve({
                status: UploadStatus.Success
            });
        });

        stream.on('error', () => {
            console.log('Error');
            resolve({
                status: UploadStatus.Failed
            });
        });
    });
}
