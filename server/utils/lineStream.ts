import * as LOG from './logger';
import * as fs from 'fs';
import { Readable } from 'node:stream';
import * as readline from 'node:readline';
// import * as readline from 'node:readline/promises';

export class LineStream {
    private inputName: string | undefined = undefined;
    private inputStream: NodeJS.ReadableStream | undefined = undefined;

    constructor(inputStream?: NodeJS.ReadableStream | undefined, inputName?: string | undefined) {
        this.inputName = inputName;
        this.inputStream = inputStream;
    }

    async readLines(filter?: string, ignoreCase?: boolean): Promise<string[] | null> {
        try {
            if (!this.inputStream && this.inputName)
                this.inputStream = fs.createReadStream(this.inputName);
            if (!this.inputStream)
                return null;
        } catch (error) {
            LOG.error('LineStream.readLines', LOG.LS.eSYS, error);
            return null;
        }

        return new Promise<string[]>((resolve, reject) => {
            try {
                if (!this.inputStream) {
                    reject('this.readStream is null');
                    return;
                }

                const rl = readline.createInterface({
                    input: new Readable().wrap(this.inputStream),
                    output: process.stdout,
                    terminal: false
                });

                const results: string[] = [];
                const filterNorm: string = (filter ?? '').toLowerCase();
                rl.on('line', line => {
                    let pushLine: boolean = false;
                    if (!filter)
                        pushLine = true;
                    else if (!ignoreCase && line.includes(filter))
                        pushLine = true;
                    else if (ignoreCase && line.toLowerCase().includes(filterNorm))
                        pushLine = true;

                    if (pushLine)
                        results.push(line);
                });

                rl.on('close', () => resolve(results));
            } catch (err) {
                reject(err);
            }
        });
    }
}