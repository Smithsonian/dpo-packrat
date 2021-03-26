/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-control-regex */
/* eslint-disable no-useless-escape */
import * as L from 'lodash';
import * as path from 'path';
import { Stats } from 'fs';
import * as fs from 'fs-extra';
import { promises as fsp } from 'fs';
import * as crypto from 'crypto';

import * as LOG from './logger';

export type IOResults = {
    success: boolean;
    error: string;
};

export type HashResults = {
    hash: string;
    dataLength: number;
    success: boolean;
    error: string;
};

export type StatResults = {
    stat: Stats | null;
    success: boolean;
    error: string;
};

export class Helpers {
    static arraysEqual(input1: any, input2: any): boolean {
        if (!Array.isArray(input1) || ! Array.isArray(input2) || input1.length !== input2.length)
            return false;
        return L.isEqual(input1.sort(), input2.sort());
    }

    static iterablesEqual(input1: Iterable<any>, input2: Iterable<any>): boolean {
        const array1: any[] = [];
        const array2: any[] = [];
        for (const item of input1)
            array1.push(item);
        for (const item of input2)
            array2.push(item);
        return Helpers.arraysEqual(array1, array2);
    }

    // Adapted from  https://github.com/npm/unique-slug/blob/master/index.js
    static randomSlug(): string {
        return (Math.random().toString(16) + '0000000').substr(2, 12) + (Math.random().toString(16) + '0000000').substr(2, 12);
    }

    // Adapted from https://github.com/npm/unique-filename/blob/master/index.js
    static randomFilename(filepath: string, prefix: string): string {
        return path.join(filepath, (prefix ? prefix + '-' : '') + Helpers.randomSlug());
    }

    // Adapted from https://github.com/sindresorhus/filename-reserved-regex/blob/master/index.js
    static validFilename(filename: string): boolean {
        const bInvalid: boolean = /[<>:"\/\\|?*\x00-\x1F]/g.test(filename) ||               // Windows and Posix
                                  /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(filename);  // Windows
        return !bInvalid;
    }

    static async copyFile(nameSource: string, nameDestination: string, allowOverwrite: boolean = true): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            await fsp.copyFile(nameSource, nameDestination, allowOverwrite ? 0 : fs.constants.COPYFILE_EXCL);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.copyFile', error);
            res.success = false;
            res.error = `Unable to copy ${nameSource} to ${nameDestination}: ${error}`;
        }
        return res;
    }

    static async moveFile(nameSource: string, nameDestination: string): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            await fsp.rename(nameSource, nameDestination);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.moveFile', error);
            res.success = false;
            res.error = `Unable to move ${nameSource} to ${nameDestination}: ${error}`;
        }
        return res;
    }

    static async fileOrDirExists(name: string): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            const stats = await fsp.stat(name);
            /* istanbul ignore next */ // executing this code requires something like a symlink/junction point, which I don't want to create just for test coverage
            if (!stats.isFile && !stats.isDirectory) {
                res.success = false;
                res.error = `${name} does not exist`;
            }
        } catch (error) /* istanbul ignore next */ {
            // LOG.logger.error('Helpers.fileOrDirExists', error);
            res.success = false;
            res.error = `${name} does not exist: ${error}`;
        }
        return res;
    }

    static async ensureFileExists(filename: string): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            const fileHandle: fsp.FileHandle = await fsp.open(filename, 'a');
            await fileHandle.close();
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.ensureFileExists', error);
            res.success = false;
            res.error = `Unable to ensure existence of ${filename}: ${error}`;
        }
        return res;
    }

    static async initializeFile(source: string | null, dest: string, description: string): Promise<IOResults> {
        let ioResults: IOResults;
        ioResults = await Helpers.fileOrDirExists(dest);
        if (ioResults.success)
            return ioResults;

        LOG.logger.info(`${description} Creating ${dest}`);
        ioResults = source ? await Helpers.copyFile(source, dest) : await Helpers.ensureFileExists(dest);
        /* istanbul ignore if */
        if (!ioResults.success)
            LOG.logger.error(`${description} Unable to create ${dest}`);
        return ioResults;
    }

    static async filesMatch(file1: string, file2: string): Promise<IOResults> {
        let ioResults: IOResults;
        ioResults = await Helpers.fileOrDirExists(file1);
        if (!ioResults.success)
            return ioResults;

        ioResults = await Helpers.fileOrDirExists(file2);
        if (!ioResults.success)
            return ioResults;

        try {
            const file1Buf = await fsp.readFile(file1);
            const file2Buf = await fsp.readFile(file2);
            ioResults.success = file1Buf.equals(file2Buf);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.ensureFileExists', error);
            ioResults.success = false;
            ioResults.error = `Unable to test if files match: ${error}`;
        }
        return ioResults;
    }

    /** Streams fileSize random bytes to stream; returns the sha512 hash on success */
    static async createRandomFile(stream: NodeJS.WritableStream, fileSize: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                const hash = crypto.createHash('sha512');

                let bytesRemaining: number = fileSize;

                do {
                    const chunkSize: number = bytesRemaining > 1024 ? 1024 : bytesRemaining;
                    const buffer = crypto.randomBytes(chunkSize);

                    bytesRemaining -= chunkSize;
                    stream.write(buffer);
                    hash.write(buffer);
                } while (bytesRemaining > 0);

                stream.end();
                stream.on('finish', () => { resolve(hash.digest('hex')); });
                stream.on('error', reject);
            } catch (error) /* istanbul ignore next */ {
                LOG.logger.error('Helpers.createRandomFile() error', error);
                reject(error);
            }
        });
    }

    static async removeFile(filename: string): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            await fsp.unlink(filename);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.removeFile', error);
            res.success = false;
            res.error = `Unable to remove file ${filename}: ${error}`;
        }
        return res;
    }

    static async createDirectory(directory: string): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            await fsp.mkdir(directory, { recursive: true });
            // if (!fs.existsSync(directory))
            //     fs.mkdirsSync(directory);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.createDirectory', error);
            res.success = false;
            res.error = `Unable to create directory ${directory}: ${error}`;
        }
        return res;
    }

    static async removeDirectory(directory: string, recursive: boolean = false): Promise<IOResults> {
        const res: IOResults = {
            success: true,
            error: ''
        };

        try {
            await fsp.rmdir(directory, { recursive });
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.removeDirectory', error);
            res.success = false;
            res.error = `Unable to remove directory ${directory}: ${error}`;
        }
        return res;
    }

    static async initializeDirectory(directory: string, description: string): Promise<IOResults> {
        let ioResults: IOResults = await Helpers.fileOrDirExists(directory);
        if (ioResults.success)
            return ioResults;

        LOG.logger.info(`${description} Creating ${directory}`);
        ioResults = await Helpers.createDirectory(directory);
        /* istanbul ignore if */
        if (!ioResults.success)
            LOG.logger.error(`${description} Unable to create ${directory}`);
        return ioResults;
    }

    static async getDirectoryEntriesRecursive(directory: string, maxDepth: number = 32): Promise<string[] | null> {
        const dirEntries: string[] = [];

        try {
            const files: string[] = await fsp.readdir(directory);
            for (const fileName of files) {
                const fullPath: string = path.join(directory, fileName);
                const stats = await fsp.stat(fullPath);
                if (stats.isDirectory()) {
                    if (maxDepth > 0) {
                        const subDirEntries: string[] | null = await Helpers.getDirectoryEntriesRecursive(fullPath, maxDepth - 1);
                        /* istanbul ignore next */
                        if (subDirEntries)
                            for (const subDirEntry of subDirEntries)
                                dirEntries.push(subDirEntry);
                    }
                } else
                    dirEntries.push(fullPath);
            }
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.getDirectoryEntriesRecursive', error);
            return null;
        }
        return dirEntries;
    }

    static async stat(filePath: string): Promise<StatResults> {
        const res: StatResults = {
            stat: null,
            success: true,
            error: ''
        };

        try {
            res.stat = await fsp.stat(filePath);
            res.success = true;
        } catch (error) /* istanbul ignore next */ {
            res.success = false;
            res.error = JSON.stringify(error);
        }
        return res;
    }

    /** Computes a hash from a file. @param hashMethod Pass in 'sha512' or 'sha1', for example */
    static async computeHashFromFile(filePath: string, hashMethod: string): Promise<HashResults> {
        try {
            return await Helpers.computeHashFromStream(fs.createReadStream(filePath), hashMethod);
        } catch (error) /* istanbul ignore next */ {
            return {
                hash: '',
                dataLength: 0,
                success: false,
                error: `Helpers.computeHashFromFile: ${JSON.stringify(error)}`
            };
        }
    }

    // Adapted from https://stackoverflow.com/questions/33599688/how-to-use-es8-async-await-with-streams
    /** Computes a hash from a stream. @param hashMethod Pass in 'sha512' or 'sha1', for example */
    static async computeHashFromStream(stream: NodeJS.ReadableStream, hashMethod: string): Promise<HashResults> {
        try {
            let dataLength: number = 0;
            const hash = crypto.createHash(hashMethod);
            stream.pipe(hash);

            return new Promise<HashResults>((resolve) => {
                stream.on('data', (chunk: Buffer) => { dataLength += chunk.length; });
                stream.on('end', () => { resolve({ hash: hash.digest('hex'), dataLength, success: true, error: '' }); });
                stream.on('error', () => { resolve({ hash: '', dataLength: 0, success: false, error: 'Helpers.computeHashFromFile() Stream Error' }); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.computeHashFromFile', error);
            return { hash: '', dataLength: 0, success: false, error: `Helpers.computeHashFromFile: ${JSON.stringify(error)}` };
        }
    }

    static computeHashFromString(input: string, hashMethod: string): string {
        const hash: crypto.Hash = crypto.createHash(hashMethod);
        return hash.update(input).digest('hex');
    }

    static async readFileFromStream(stream: NodeJS.ReadableStream): Promise<Buffer | null> {
        try {
            const bufArray: Buffer[] = [];
            return new Promise<Buffer | null>((resolve) => {
                stream.on('data', (chunk: Buffer) => { bufArray.push(chunk); });
                stream.on('end', () => { resolve(Buffer.concat(bufArray)); }); /* istanbul ignore next */
                stream.on('error', () => { resolve(null); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.readFileFromStream', error);
            return null;
        }
    }

    static async computeSizeOfStream(stream: NodeJS.ReadableStream): Promise<number | null> {
        try {
            let size: number = 0;
            return new Promise<number | null>((resolve) => {
                stream.on('data', (chunk: Buffer) => { size += chunk.length; });
                stream.on('end', () => { resolve(size); }); /* istanbul ignore next */
                stream.on('error', () => { resolve(null); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.computeSizeOfStream', error);
            return null;
        }
    }

    static async writeFileToStream(fileName: string, writeStream: NodeJS.WritableStream): Promise<IOResults> {
        try {
            const readStream: NodeJS.ReadableStream = await fs.createReadStream(fileName);
            return await Helpers.writeStreamToStream(readStream, writeStream);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.writeFileToStream', error);
            return { success: false, error: `Helpers.writeFileToStream: ${JSON.stringify(error)}` };
        }
    }

    static async writeStreamToStream(readStream: NodeJS.ReadableStream, writeStream: NodeJS.WritableStream): Promise<IOResults> {
        try {
            readStream.pipe(writeStream);
            return new Promise<IOResults>((resolve) => {
                writeStream.on('finish', () => { resolve({ success: true, error: '' }); }); /* istanbul ignore next */
                writeStream.on('error', () => { resolve({ success: false, error: '' }); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.writeStreamToStream', error);
            return { success: false, error: `Helpers.writeFileToStream: ${JSON.stringify(error)}` };
        }
    }

    static async writeJsonAndComputeHash(dest: string, obj: any, hashMethod: string): Promise<HashResults> {
        try {
            await fs.writeJson(dest, obj);
            return await Helpers.computeHashFromFile(dest, hashMethod);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.writeJsonAndComputeHash', error);
            return { hash: '', dataLength: 0, success: false, error: JSON.stringify(error) };
        }
    }

    static async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    static convertStringToDate(dateString: string): Date | null {
        try {
            const date: Date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.convertStringToDate', error);
            return null;
        }
    }

    static convertDateToYYYYMMDD(date: Date): string {
        const dayOfMonth = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return year + '-' + month + '-' + dayOfMonth;
    }

    static safeNumber(value: any): number | null {
        if (value == null)
            return null;
        return parseInt(value);
    }

    static safeBoolean(value: any): boolean | null {
        if (value == null)
            return null;
        return value ? true : false;
    }
}