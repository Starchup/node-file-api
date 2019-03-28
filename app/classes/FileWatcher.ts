export interface FileWatcherDelegate
{
    (message: string): void;
}

export class FileWatcher
{
    private fs = require('fs');
    private fsp = this.fs.promises;

    private _filename: string;

    constructor(public filename: string, public delegate: FileWatcherDelegate)
    {
        this._filename = filename;

        setInterval(() =>
        {
            console.log('checking');

            if (!this.fileReadableSync()) return;

            this.readFile().then((data: string) =>
            {
                return this.deleteFile().then(() =>
                {
                    return delegate(data.toString());
                });
            }).catch((err: Error) =>
            {
                console.error('FileWatcher ' + filename + ' got error: ' + err.toString());
            });
        }, 2000);
    }

    /* Private helpers */
    private fileReadableSync(): boolean
    {
        try
        {
            this.fs.accessSync(this._filename, this.fs.R_OK);
        }
        catch (e)
        {
            return false;
        }
        return true;
    }

    private readFile()
    {
        return this.fsp.readFile(this._filename);
    }

    private deleteFile()
    {
        return this.fsp.unlink(this._filename);
    }
}