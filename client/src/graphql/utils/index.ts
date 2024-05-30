/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */

/**
 * GraphQL Utils
 *
 * These utility provides custom implementation for upload functionality in
 * apollo client.
 */
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

// our central variable holding the most relevant message on why the upload failed
export let uploadFailureMessage: string = 'undefined';

// fetch our actual upload passing in the url and relevant options such as
// the method, headers, etc.
const uploadFetch = (url: string, options: any): any =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        // initialize our request and set any headers
        xhr.open(options.method, url, true);
        Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
        });

        // once the request completed, handle any errors or the response body
        xhr.onload = () => {
            // The request was completed, but it was not successful
            if (xhr.status < 200 && xhr.status >= 300) {
                uploadFailureMessage = `Request failed with status: ${xhr.status}`;
                return reject(new Error(uploadFailureMessage));
            }

            // if we have success then build our response
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
            uploadFailureMessage = 'Network request failed';
            reject(new Error(uploadFailureMessage));
        };

        xhr.ontimeout = () => {
            uploadFailureMessage = 'Upload request timed out';
            reject(new Error(uploadFailureMessage));
        };

        xhr.onabort = () => {
            uploadFailureMessage = 'Upload aborted';
            reject(new Error(uploadFailureMessage));
        };

        // if we have an upload request then connect our callbacks to handle responses
        if (xhr.upload) {
            xhr.upload.onprogress = options.onProgress;
            xhr.upload.onabort = options.onCancel;
            xhr.upload.onerror = options.onFailed;
        }

        // why cancel and abort here automatically?
        // options.onCancel(() => {
        //     xhr.abort();
        // });

        xhr.send(options.body);
    });

export const apolloFetch = (uri: any, options: any): any => {
    try {
        if (options.useUpload)
            return uploadFetch(uri, options);

        return fetch(uri, {
            ...options,
            credentials: 'include'
        });
    } catch (error) {
        const message: string = (error instanceof Error) ? `: ${error.message}` : '';
        console.log(`[PACKRAT:ERROR] apolloFetch failed ${message}`);
    }
};
