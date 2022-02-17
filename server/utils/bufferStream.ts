/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Transform, TransformCallback } from 'stream';

type BufferItem = {
    chunk: any;
    encoding: BufferEncoding;
};

/** This Transform stream buffers written chunks until writing is complete.
 * As a result, this implementation is not memory efficient!  Use cautiously.
 */
export class BufferStream extends Transform {
    private _pending: BufferItem[] = [];
    constructor(options = {}) {
        super(options);
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        this._pending.push({ chunk, encoding });
        callback();
    }

    _flush(callback: TransformCallback): void {
        while (this._pending.length > 0) {
            const BI: BufferItem | undefined = this._pending.shift();
            if (BI)
                this.push(BI.chunk, BI.encoding);
        }
        callback();
    }
}