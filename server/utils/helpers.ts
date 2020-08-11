/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-control-regex */
/* eslint-disable no-useless-escape */
import * as L from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as LOG from './logger';

export type IOResults = {
    ok: boolean,
    error: string
};

export type HashResults = {
    hash: string,
    ok: boolean,
    error: string
};

export type StatResults = {
    stat: fs.Stats | null,
    ok: boolean,
    error: string
};

export class Helpers {
    static arraysEqual(input1: any, input2: any): boolean {
        if (!Array.isArray(input1) || ! Array.isArray(input2) || input1.length !== input2.length)
            return false;
        return L.isEqual(input1.sort(), input2.sort());
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

    static copyFile(nameSource: string, nameDestination: string, allowOverwrite: boolean = true): IOResults {
        const res: IOResults = {
            ok: true,
            error: ''
        };

        try {
            fs.copyFileSync(nameSource, nameDestination, allowOverwrite ? 0 : fs.constants.COPYFILE_EXCL);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.copyFile', error);
            res.ok = false;
            res.error = `Unable to copy ${nameSource} to ${nameDestination}: ${error}`;
        }
        return res;
    }

    static fileOrDirExists(name: string): IOResults {
        const res: IOResults = {
            ok: true,
            error: ''
        };

        try {
            if (!fs.existsSync(name))
                res.ok = false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.fileExists', error);
            res.ok = false;
            res.error = `Unable to test existence of ${name}: ${error}`;
        }
        return res;
    }

    static ensureFileExists(filename: string): IOResults {
        const res: IOResults = {
            ok: true,
            error: ''
        };

        try {
            fs.closeSync(fs.openSync(filename, 'a'));
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.ensureFileExists', error);
            res.ok = false;
            res.error = `Unable to ensure existence of ${filename}: ${error}`;
        }
        return res;
    }

    static removeFile(filename: string): IOResults {
        const res: IOResults = {
            ok: true,
            error: ''
        };

        try {
            if (fs.existsSync(filename))
                fs.unlinkSync(filename);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.removeFile', error);
            res.ok = false;
            res.error = `Unable to remove file ${filename}: ${error}`;
        }
        return res;
    }

    static createDirectory(directory: string): IOResults {
        const res: IOResults = {
            ok: true,
            error: ''
        };

        try {
            if (!fs.existsSync(directory))
                fs.mkdirSync(directory);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.createDirectory', error);
            res.ok = false;
            res.error = `Unable to create directory ${directory}: ${error}`;
        }
        return res;
    }

    static removeDirectory(directory: string): IOResults {
        const res: IOResults = {
            ok: true,
            error: ''
        };

        try {
            if (fs.existsSync(directory))
                fs.rmdirSync(directory);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('Helpers.removeDirectory', error);
            res.ok = false;
            res.error = `Unable to remove directory ${directory}: ${error}`;
        }
        return res;
    }

    static stat(filePath: string): StatResults {
        const res: StatResults = {
            stat: null,
            ok: true,
            error: ''
        };

        try {
            res.stat = fs.statSync(filePath);
            res.ok = true;
        } catch (error) /* istanbul ignore next */ {
            res.ok = false;
            res.error = JSON.stringify(error);
        }
        return res;
    }

    // Adapted from https://stackoverflow.com/questions/33599688/how-to-use-es8-async-await-with-streams
    /** Computes a hash from a file. @param hashMethod Pass in 'sha512' or 'sha1', for example */
    static async computeHashFromFile(filePath: string, hashMethod: string): Promise<HashResults> {
        const res: HashResults = {
            hash: '',
            ok: true,
            error: ''
        };
        const hash      = crypto.createHash(hashMethod);
        const stream    = fs.createReadStream(filePath);
        stream.pipe(hash);

        return new Promise<HashResults>((resolve) => {
            stream.on('end', () => {
                res.hash = hash.digest('hex');
                resolve(res);
            });

            stream.on('error', () => {
                // do we need to perform cleanup?
                res.ok = false;
                res.error = 'Stream Error';
                resolve(res);
            });
        });
    }
}