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
import { Readable, Writable } from 'stream';

require('json-bigint-patch'); // patch JSON.stringify's handling of BigInt

export type IOResults = {
    success: boolean;
    error?: string;
};

export type IOResultsSized = {
    success: boolean;
    error?: string;
    size: number;
};

export type HashResults = {
    hash: string;
    dataLength: number;
    success: boolean;
    error?: string;
};

export type StatResults = {
    stat: Stats | null;
    success: boolean;
    error?: string;
};

export type IOStatus = {
    state: number;
    message?: string;
    data?: any;
};

export type OpResult = {
    success: boolean,
    message: string,
    data?: any,
};

export enum ProcessState {
    UNDEFINED = 'undefined',
    WAITING = 'waiting',        // in a waiting to be staged/queued
    PENDING = 'pending',        // was initialized and pending execution
    ACTIVE = 'active',          // is working
    PROCESSING = 'processing',  // finished core work and finalizing
    COMPLETED = 'completed',    // finished successfully
    FAILED = 'failed',          // error anywhere during process
    CANCELLED = 'cancelled'     // was the process cancelled by the user
}

export enum ProcessStatus {
    UNDEFINED = 'undefined',
    GOOD = 'good',
    ERROR = 'error',
}

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

    static generateGUID(): string {
        return crypto.randomUUID();
    }

    // Adapted from https://github.com/sindresorhus/filename-reserved-regex/blob/master/index.js
    static validFilename(filename: string): boolean {
        const bInvalid: boolean = /[<>:"\/\\|?*\x00-\x1F]/g.test(filename) ||               // Windows and Posix
                                  /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(filename);  // Windows
        return !bInvalid;
    }

    static async copyFile(nameSource: string, nameDestination: string, allowOverwrite: boolean = true): Promise<IOResults> {
        try {
            await fsp.copyFile(nameSource, nameDestination, allowOverwrite ? 0 : fs.constants.COPYFILE_EXCL);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.copyFile', LOG.LS.eSYS, error);
            return { success: false, error: `Unable to copy ${nameSource} to ${nameDestination} (cwd = ${process.cwd()}): ${error}` };
        }
        return { success: true };
    }

    static async moveFile(nameSource: string, nameDestination: string, allowedToFail?: boolean): Promise<IOResults> {
        try {
            await fsp.rename(nameSource, nameDestination);
        } catch (error) /* istanbul ignore next */ {
            if (allowedToFail)
                LOG.info(`Helpers.moveFile: ${Helpers.JSONStringify(error)}`, LOG.LS.eSYS);
            else
                LOG.error('Helpers.moveFile', LOG.LS.eSYS, error);
            return { success: false, error: `Unable to move ${nameSource} to ${nameDestination}: ${error}` };
        }
        return { success: true };
    }

    static async fileOrDirExists(name: string): Promise<IOResults> {
        try {
            const stats = await fsp.stat(name);
            /* istanbul ignore next */ // executing this code requires something like a symlink/junction point, which I don't want to create just for test coverage
            if (!stats.isFile && !stats.isDirectory)
                return { success: false, error: `${name} does not exist` };
        } catch (error) /* istanbul ignore next */ {
            // LOG.error('Helpers.fileOrDirExists', LOG.LS.eSYS, error);
            return { success: false, error: `${name} does not exist: ${error}` };
        }
        return { success: true };
    }

    static async ensureFileExists(filename: string): Promise<IOResults> {
        try {
            const fileHandle: fsp.FileHandle = await fsp.open(filename, 'a');
            await fileHandle.close();
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.ensureFileExists', LOG.LS.eSYS, error);
            return { success: false, error: `Unable to ensure existence of ${filename}: ${error}` };
        }
        return { success: true };
    }

    static async initializeFile(source: string | null, dest: string, description: string): Promise<IOResults> {
        let ioResults: IOResults;
        ioResults = await Helpers.fileOrDirExists(dest);
        if (ioResults.success)
            return ioResults;

        LOG.info(`${description} Creating ${dest}`, LOG.LS.eSYS);
        ioResults = source ? await Helpers.copyFile(source, dest) : await Helpers.ensureFileExists(dest);
        /* istanbul ignore if */
        if (!ioResults.success)
            LOG.error(`${description} Unable to create ${dest}`, LOG.LS.eSYS);
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
            LOG.error('Helpers.ensureFileExists', LOG.LS.eSYS, error);
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
                stream.on('error', (err) => { LOG.error(`Helpers.createRandomFile error ${Helpers.JSONStringify(err)}`, LOG.LS.eSYS); reject(); });
            } catch (error) /* istanbul ignore next */ {
                LOG.error('Helpers.createRandomFile() error', LOG.LS.eSYS, error);
                reject(error);
            }
        });
    }

    static async removeFile(filename: string): Promise<IOResults> {
        try {
            await fsp.unlink(filename);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.removeFile', LOG.LS.eSYS, error);
            return { success: false, error: `Unable to remove file ${filename}: ${error}` };
        }
        return { success: true };
    }

    static async createDirectory(directory: string): Promise<IOResults> {
        try {
            await fsp.mkdir(directory, { recursive: true });
            // if (!fs.existsSync(directory))
            //     fs.mkdirsSync(directory);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.createDirectory', LOG.LS.eSYS, error);
            return { success: false, error: `Unable to create directory ${directory}: ${error}` };
        }
        return { success: true };
    }

    static async removeDirectory(directory: string, recursive: boolean = false, logErrors: boolean = true): Promise<IOResults> {
        try {
            await fsp.rmdir(directory, { recursive }); // await fsp.rm(directory, { recursive });
        } catch (error) /* istanbul ignore next */ {
            if (logErrors)
                LOG.error('Helpers.removeDirectory', LOG.LS.eSYS, error);
            return { success: false, error: `Unable to remove directory ${directory}: ${error}` };
        }
        return { success: true };
    }

    static async initializeDirectory(directory: string, description: string): Promise<IOResults> {
        let ioResults: IOResults = await Helpers.fileOrDirExists(directory);
        if (ioResults.success)
            return ioResults;

        LOG.info(`${description} Creating ${directory}`, LOG.LS.eSYS);
        ioResults = await Helpers.createDirectory(directory);
        /* istanbul ignore if */
        if (!ioResults.success)
            LOG.error(`${description} Unable to create ${directory}`, LOG.LS.eSYS);
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
            LOG.error('Helpers.getDirectoryEntriesRecursive', LOG.LS.eSYS, error);
            return null;
        }
        return dirEntries;
    }

    static async stat(filePath: string): Promise<StatResults> {
        const res: StatResults = {
            stat: null,
            success: true
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
            return new Promise<HashResults>((resolve) => {
                let dataLength: number = 0;
                const hash = crypto.createHash(hashMethod);

                stream.on('data', (chunk: Buffer) => { dataLength += chunk.length; });
                stream.on('end', () => { resolve({ hash: hash.digest('hex'), dataLength, success: true }); });
                stream.on('error', (err) => { resolve({ hash: '', dataLength: 0, success: false, error: `Helpers.computeHashFromFile() Stream Error ${Helpers.JSONStringify(err)}` }); });
                stream.pipe(hash);
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.computeHashFromFile', LOG.LS.eSYS, error);
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
                stream.on('error', (err) => { LOG.error(`Helpers.readFileFromStream error ${Helpers.JSONStringify(err)}`, LOG.LS.eSYS); resolve(null); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.readFileFromStream', LOG.LS.eSYS, error);
            return null;
        }
    }

    static async readFileFromStreamThrowErrors(stream: NodeJS.ReadableStream): Promise<Buffer> {
        try {
            const bufArray: Buffer[] = [];
            return new Promise<Buffer>((resolve, reject) => {
                stream.on('data', (chunk: Buffer) => { bufArray.push(chunk); });
                stream.on('end', () => { resolve(Buffer.concat(bufArray)); }); /* istanbul ignore next */
                stream.on('error', (err) => { LOG.error(`Helpers.readFileFromStreamThrowErrors error ${Helpers.JSONStringify(err)}`, LOG.LS.eSYS); reject(); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.readFileFromStreamThrowErrors', LOG.LS.eSYS, error);
            throw error;
        }
    }

    static async computeSizeOfStream(stream: NodeJS.ReadableStream): Promise<number | null> {
        try {
            let size: number = 0;
            return new Promise<number | null>((resolve) => {
                stream.on('data', (chunk: Buffer) => { size += chunk.length; });
                stream.on('end', () => { resolve(size); }); /* istanbul ignore next */
                stream.on('error', (err) => { LOG.error(`Helpers.computeSizeOfStream error ${Helpers.JSONStringify(err)}`, LOG.LS.eSYS); resolve(null); });
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.computeSizeOfStream', LOG.LS.eSYS, error);
            return null;
        }
    }

    static async writeStreamToFile(readStream: NodeJS.ReadableStream, fileName: string): Promise<IOResults> {
        let writeStream: NodeJS.WritableStream | null = null;
        try {

            // extract the directory from our path and make sure it exists
            const dirName: string = path.dirname(fileName);
            await Helpers.createDirectory(dirName);

            // write our stream to file
            writeStream = await fs.createWriteStream(fileName);
            const retValue: IOResults = await Helpers.writeStreamToStream(readStream, writeStream);
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.writeStreamToFile', LOG.LS.eSYS, error);
            return { success: false, error: `Helpers.writeStreamToFile: ${JSON.stringify(error)}` };
        } finally {
            if (writeStream)
                writeStream.end();
        }
    }

    static async writeFileToStream(fileName: string, writeStream: NodeJS.WritableStream): Promise<IOResults> {
        try {
            const readStream: NodeJS.ReadableStream = await fs.createReadStream(fileName);
            return await Helpers.writeStreamToStream(readStream, writeStream);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.writeFileToStream', LOG.LS.eSYS, error);
            return { success: false, error: `Helpers.writeFileToStream: ${JSON.stringify(error)}` };
        }
    }

    // static writeStreamCounter: number = 0;
    static async writeStreamToStream(readStream: NodeJS.ReadableStream, writeStream: NodeJS.WritableStream, waitOnEnd: boolean = false): Promise<IOResults> {
        return Helpers.writeStreamToStreamComputeSize(readStream, writeStream, waitOnEnd);
    }

    static async writeStreamToStreamComputeSize(readStream: NodeJS.ReadableStream, writeStream: NodeJS.WritableStream, waitOnEnd: boolean = false): Promise<IOResultsSized> {
        try {
            return new Promise<IOResultsSized>((resolve) => {
                let size: number = 0;

                readStream.on('data', (chunk: Buffer) => { size += chunk.length; });
                /* istanbul ignore else */
                if (!waitOnEnd) {
                    writeStream.on('finish', () => { resolve({ success: true, size }); }); /* istanbul ignore next */
                    writeStream.on('end', () => { resolve({ success: true, size }); }); /* istanbul ignore next */
                } else {
                    readStream.on('end', () => { resolve({ success: true, size }); });
                    writeStream.on('end', () => { resolve({ success: true, size }); });
                } /* istanbul ignore next */
                readStream.on('error', (err) => { resolve({ success: false, error: `readstream error: ${Helpers.JSONStringify(err)}`, size }); });
                writeStream.on('error', (err) => { resolve({ success: false, error: `writestream error: ${Helpers.JSONStringify(err)}`, size }); });

                readStream.pipe(writeStream);
            });
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.writeStreamToStream', LOG.LS.eSYS, error);
            return { success: false, error: `Helpers.writeFileToStream: ${JSON.stringify(error)}`, size: 0 };
        }
    }

    static destroyReadStream(stream: NodeJS.ReadableStream): void {
        const read: Readable = stream as Readable;
        if (read)
            read.destroy();
    }

    static destroyWriteStream(stream: NodeJS.WritableStream): void {
        const write: Writable = stream as Writable;
        if (write)
            write.destroy();
    }

    static async writeJsonAndComputeHash(dest: string, obj: any, hashMethod: string, replacer: any | null = null): Promise<HashResults> {
        try {
            if (!replacer)
                await fs.writeJson(dest, obj);
            else
                await fs.writeJson(dest, obj, { replacer });
            return await Helpers.computeHashFromFile(dest, hashMethod);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.writeJsonAndComputeHash', LOG.LS.eSYS, error);
            return { hash: '', dataLength: 0, success: false, error: JSON.stringify(error) };
        }
    }

    static async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    /** dateString is in UTC by default, unless otherwise specified in the string itself */
    static convertStringToDate(dateString: string): Date | null {
        try {
            const date: Date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('Helpers.convertStringToDate', LOG.LS.eSYS, error);
            return null;
        }
    }

    static convertDateToString(date: Date): string {
        // resulting format is <year>-<month>-<day>. example: 2024-07-24
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static convertFileSizeToString(numBytes: number, format: 'TB' | 'GB' | 'MB' | 'KB', label: boolean = true): string {
        if (numBytes < 0)
            return 'Error: -1';

        const units = {
            TB: 1e12, // 1 Terabyte = 10^12 bytes
            GB: 1e9,  // 1 Gigabyte = 10^9 bytes
            MB: 1e6,  // 1 Megabyte = 10^6 bytes
            KB: 1e3   // 1 Kilobyte = 10^3 bytes
        };

        if (!(format in units))
            return `Invalid: ${format}`;

        const converted = numBytes / units[format];
        const result = converted.toFixed(2)+((label===true)?` ${format}`:'');
        return result;
    }

    static safeNumber(value: any): number | null {
        if (value == null)
            return null;
        return parseFloat(value);
    }

    static safeBoolean(value: any): boolean | null {
        if (value == null)
            return null;
        return value ? true : false;
    }

    static safeString(value: any): string | null {
        if (value == null)
            return null;
        if (typeof(value) === 'string')
            return value;
        return null;
    }

    static safeDate(value: any): Date | null {
        if (value == null)
            return null;
        if (!isNaN(value) && value instanceof Date)
            return value;
        if (typeof(value) !== 'string')
            return null;
        const timestamp: number = Date.parse(value);
        return isNaN(timestamp) ? null : new Date(timestamp);
    }

    static safeRound(input: number | null, precision: number = 10): number | null {
        if (input === null)
            return null;
        return parseFloat(input.toFixed(precision));
    }

    static JSONParse(input: any): any {
        if(typeof(input) === 'string') {
            try {
                const json = JSON.parse(input);
                return json;
            } catch(error) {
                const message = error instanceof Error ? error.message : String(error);
                LOG.error(`JSON Failure: ${this.JSONStringify(message)}`,LOG.LS.eSYS);
                return undefined;
            }
        }
        return input;
    }
    static safeJSONParse(input: any): any {
        if(typeof(input)==='string') {
            try {
                // Pre-process large numbers in the raw JSON string
                const processedJson = this.JSONRemoveLargeNumbers(input);
                if(processedJson==='')
                    throw new Error('failed to process large numbers');

                // Parse the cleaned JSON string with a reviver
                const json = JSON.parse(processedJson, (_key, value) => {
                    if (typeof value === 'string' && !isNaN(Number(value))) {
                        return Number(value); // Convert back to number after parsing
                    }
                    return value;
                });
                return json;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                LOG.error(`JSONParse Failure: ${message}`,LOG.LS.eSYS);
                return undefined;
            }
        }
        return input;
    }

    static JSONStringify(obj: any): string {
        return JSON.stringify(obj, Helpers.saferStringify);
    }

    /** Stringifies Maps, Sets, streams (sort of); BigInts are handled by json-bigint-patch */
    static saferStringify(key: any, value: any): any {
        key;
        if (value == null)
            return value;
        // if (typeof value === 'bigint')
        //     return value.toString();
        if (value instanceof Map)
            return [...value];
        if (value instanceof Set)
            return [...value];
        if (value instanceof Date)
            return value.toISOString();
        if (value.pipe && typeof (value.pipe) === 'function')
            return 'stream';
        return value;
    }

    /** Stringifies Database Rows, removing *Orig keys */
    static stringifyDatabaseRow(key: any, value: any): any {
        /* istanbul ignore else */
        if (typeof key === 'string') {
            if (key.endsWith('Orig'))
                return undefined;
        }
        return Helpers.saferStringify(key, value);
    }

    static JSONRemoveLargeNumbers(jsonString: string): string {
        try {
            const result = jsonString.replace(/-?\d+\.\d+e[+-]?\d+/gi, (match) => {
                const num = Number(match);
                // console.log(`🔹 Replacing: ${match} -> ${num}`);

                if (isNaN(num))
                    return match; // Leave it untouched if it's not a valid number

                // Clamp extreme values and wrap them in quotes for later processing
                return num > Number.MAX_VALUE ? `"${Number.MAX_VALUE}"`
                    : num < -Number.MAX_VALUE ? `"${-Number.MAX_VALUE}"`
                        : `"${num}"`; // Convert number to string to reprocess later
            });
            return result;
        } catch(error) {
            const message = error instanceof Error ? error.message : String(error);
            LOG.error(`JSON number processing failed: ${this.JSONStringify(message)}`,LOG.LS.eSYS);
            return '';
        }
    }

    /* c.f. https://coderwall.com/p/ostduq/escape-html-with-javascript */
    static escapeHTMLEntity(input: string): string {
        return input.replace(/[&<>"'\/]/g, function (s) {
            const entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;',
                '/': '&#x2F;'
            };
            return entityMap[s];
        });
    }

    static computeHref(path: string, anchor: string): string {
        if (!path)
            return anchor;
        return `<a href='${path}'>${Helpers.escapeHTMLEntity(anchor)}</a>`;
    }

    static validFieldId(value: any): boolean {
        if (typeof value === 'number' && value > 0 && value < 2147483648) return true;
        return false;
    }

    static getStackTrace(label: string = 'Capture Stack'): string {
        try {
            throw new Error(label);
        } catch (error) {
            return (error as Error).stack || `${label}: No stack trace available`;
        }
    }

    static cleanExpressRequest(req: any, includeBody: boolean = true, reduceHeaders: boolean = false): any {
        // returns a JSON object holding properties that can be easily used with console.log.
        // feeding a standard Request to console causes a stack overflow due to circular dependencies.
        if (!req || typeof req !== 'object') {
            return {
                method: 'UNKNOWN',
                url: 'UNKNOWN',
                headers: {},
                params: {},
                query: {},
                body: {},
                ip: 'UNKNOWN',
            };
        }

        // extract meaningful info from request ignoring cyclic dependencies
        const result = {
            method: req.method || 'UNKNOWN',
            url: req.url || 'UNKNOWN',
            headers: req.headers && typeof req.headers === 'object' ? req.headers : {},
            params: req.params && typeof req.params === 'object' ? req.params : {},
            query: req.query && typeof req.query === 'object' ? req.query : {},
            body: req.body && typeof req.body === 'object' ? req.body : {},
            ip: req.ip || 'UNKNOWN',
        };

        // include the body or not
        if(includeBody===false)
            delete result.body;

        // if we want to reduce our headers, include only core fields
        if(reduceHeaders===true) {
            const allowedHeaders = [
                'host',
                'keep-alive',
                'content-length',
                'content-type',
                'origin',
                'referer',
            ];

            result.headers = allowedHeaders.reduce((filtered, key) => {
                if (Object.prototype.hasOwnProperty.call(result, key)) {
                    filtered[key] = result.headers[key];
                }
                return filtered;
            }, {});
        }

        return result;
    }

    static showAllCharactersWithEscapes(input: string): string {
        // routine to display all characters in a string. Helpful for debugging
        // generated strings that may have escape characters, colorization, etc.
        return input.split('').map(char => {
            const charCode = char.charCodeAt(0);

            // Handle known control characters
            switch (charCode) {
                case 9:
                    return '\\t'; // Tab character
                case 10:
                    return '\\n'; // Newline character
                case 13:
                    return '\\r'; // Carriage return
                case 27:
                    return '\\x1b'; // Escape character
                default:
                    // For characters outside the printable ASCII range, use \xHH for hex representation
                    if (charCode < 32 || charCode > 126) {
                        return `\\x${charCode.toString(16).padStart(2, '0')}`; // Escape as \xHH
                    } else {
                        return char; // Return printable characters as is
                    }
            }
        }).join('');
    }

    static clampNumber(value: number): number {
        // clamp numbers to accepted ranges
        if (Number.isInteger(value)) {
            // For integers: Clamp between MIN_SAFE_INTEGER and MAX_SAFE_INTEGER
            return Math.max(Number.MIN_SAFE_INTEGER, Math.min(value, Number.MAX_SAFE_INTEGER));
        } else {
            // For floats: Clamp within Number.MAX_VALUE and MIN_VALUE (avoid Infinity)
            if (value > Number.MAX_VALUE) return Number.MAX_VALUE;
            if (value < -Number.MAX_VALUE) return -Number.MAX_VALUE;
            return value; // Return valid float as-is
        }
    }
}