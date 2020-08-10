/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as L from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import * as LOG from './logger';

export type IOResults = {
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
}