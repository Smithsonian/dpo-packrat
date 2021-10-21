import csv from 'csv-parser';
import { CSVHeaders, CSVTypes, CSVFields } from './csvTypes';
import * as LOG from '../logger';

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

                fileStream.on('error', () => reject());

                const stream = fileStream.pipe(csv({ mapHeaders }));
                const rows: T[] = [];

                stream.on('data', (data: T) => rows.push(data));
                stream.on('error', () => reject());
                stream.on('end', () => resolve(rows));
            } catch (error) /* istanbul ignore next */ {
                LOG.error('CSVParser.parse', LOG.LS.eSYS, error);
                reject();
            }
        });
    }
}
