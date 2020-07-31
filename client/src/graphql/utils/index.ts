/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const parseHeaders = (rawHeaders: any) => {
    const headers = new Headers();
    const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach((line: any) => {
        const parts = line.split(':');
        const key = parts.shift().trim();
        if (key) {
            const value = parts.join(':').trim();
            headers.append(key, value);
        }
    });
    return headers;
};

const uploadFetch = (url: string, options: any): any =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            const opts: any = {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: parseHeaders(xhr.getAllResponseHeaders() || '')
            };
            opts.url = 'responseURL' in xhr ? xhr.responseURL : opts.headers.get('X-Request-URL');
            const body = 'response' in xhr ? xhr.response : (xhr as any).responseText;
            resolve(new Response(body, opts));
        };
        xhr.onerror = () => {
            reject(new TypeError('Network request failed'));
        };
        xhr.ontimeout = () => {
            reject(new TypeError('Network request failed'));
        };
        xhr.open(options.method, url, true);

        Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
        });

        if (xhr.upload) {
            xhr.upload.onprogress = options.onProgress;
        }

        options.onAbort(() => {
            xhr.abort();
        });

        xhr.send(options.body);
    });

export const apolloFetch = (uri: any, options: any): any => {
    if (options.useUpload) {
        return uploadFetch(uri, options);
    }
    return fetch(uri, options);
};
