import csv from 'csv-parser';
import { CSVHeaders, CSVTypes, CSVFields } from './csvTypes';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as H from '../../utils/helpers';

export class CSVParser {
    /** Note that this method will throw an exception if using the await ... syntax and the specified fileStream is not readable */
    static async parse<T extends CSVFields>(fileStream: NodeJS.ReadableStream, type: CSVTypes): Promise<T[]> {
        const requiredHeaders: string[] = CSVHeaders[type];

        return new Promise((resolve, reject) => {
            try {
                const mapHeaders = ({ header }) => {
                    if (!requiredHeaders.includes(header))
                        stream.emit('error');
                    return header;
                };

                fileStream.on('error', (error) => reject(error));

                const stream = fileStream.pipe(csv({ mapHeaders }));
                const rows: T[] = [];

                stream.on('data', (data: T) => rows.push(data));
                stream.on('error', (error) => reject(error));
                stream.on('end', () => resolve(rows));
            } catch (error) /* istanbul ignore next */ {
                RK.logError(RK.LogSection.eSYS,'parse failed',H.Helpers.getErrorString(error),{},'Utils.Parser.CSV');
                reject(error);
            }
        });
    }
}
