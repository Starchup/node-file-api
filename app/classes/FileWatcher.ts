export interface FileWatcherDelegate
{
    (message: string): void;
}

export class FileWatcher
{
    private fs = require('fs');
    private fsp = this.fs.promises;

    private _fileName: string;

    constructor(public fileName: string, public delegate: FileWatcherDelegate)
    {
        this._fileName = fileName;

        setInterval(() =>
        {
            if (!this.fileReadableSync()) return;

            this.readFile().then((data: string) =>
            {
                return this.deleteFile().then(() =>
                {
                    return delegate(data.toString());
                });
            }).catch((err: Error) =>
            {
                console.error('FileWatcher ' + fileName + ' got error: ' + err.toString());
            });
        }, 100);
    }

    /* Private helpers */
    private fileReadableSync(): boolean
    {
        try
        {
            this.fs.accessSync(this._fileName, this.fs.R_OK);
        }
        catch (e)
        {
            return false;
        }
        return true;
    }

    private readFile()
    {
        return this.fsp.readFile(this._fileName);
    }

    private deleteFile()
    {
        return this.fsp.unlink(this._fileName);
    }
}