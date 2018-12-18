function futch(url, opts: any = {}, onProgress) {
    return new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.open(opts.method || 'get', url);
        for (var k in opts.headers || {})
            xhr.setRequestHeader(k, opts.headers[k]);
        xhr.onload = (e: any) => res(e.target);
        xhr.onerror = rej;
        if (xhr.upload && onProgress)
            xhr.upload.onprogress = onProgress; // event.loaded / event.total * 100 ; //event.lengthComputable
        xhr.send(opts.body);
    });
}


export interface UploadResponseObject {
    error?: string;
    id?: string;
    format?: string;
}

/**
 * The class handling the export of the created gif.
 */
export class FileUpload {

    remoteURL = 'http://localhost:3000/api/upload';

    // remoteURL = '/api/upload';
    setRemote(remoteURL): FileUpload {
        this.remoteURL = remoteURL;
        return this;
    }

    uploadBlob(blob: Blob, fileName?: string, progressCallback?): Promise<UploadResponseObject> {
        const fd = new FormData();
        fd.append('files', blob, fileName);
        return futch(this.remoteURL,
            {
                method: 'post',
                body: fd
            }, progressCallback)
            .then((res: any) => {

                if (res.status == 404) {
                    throw new Error(res.statusText);
                }
                return res.responseText;
            })
            .then((res: any) => JSON.parse(res));
        //.then( (res: any) => res.json());
    }


    // TODO @7frank implement deleting uploaded file in case the user cancels its intent to share
    cancelLastUpload() {
        console.error('TODO implementation');
    }
}
