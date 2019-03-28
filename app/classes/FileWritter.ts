export class FileWritter
{
    private fs = require('fs');
    private fsp = this.fs.promises;

    private _filename: string;

    constructor(public filename: string)
    {
        this._filename = filename;
    }

    /* Private methods */
    public writeData(data: string): Promise < boolean >
    {
        if (!this.fileExistsSync() && this.fileWrittableSync())
        {
            return this.writeFile(data);
        }

        return new Promise((resolve, reject) =>
        {
            setTimeout(() =>
            {
                resolve();
            }, 2000);
        }).then(() =>
        {
            return this.writeData(data);
        });
    }

    /* Private helpers */
    private fileExistsSync(): boolean
    {
        try
        {
            this.fs.accessSync(this._filename, this.fs.F_OK);
        }
        catch (e)
        {
            if (e.code === 'EACCES') return true;
            if (e.code === 'ENOENT') return false;

            return false;
        }
        return true;
    }

    private fileWrittableSync(): boolean
    {
        try
        {
            this.fs.accessSync(this._filename, this.fs.W_OK);
        }
        catch (e)
        {
            if (e.code === 'ENOENT') return true;
            return false;
        }
        return true;
    }

    private writeFile(data: string): Promise < boolean >
    {
        return this.fsp.writeFile(this._filename, data).then(() =>
        {
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWritter ' + this.filename + ' got error: ' + err.toString());
            return false;
        });
    }

    private deleteFile(): Promise < boolean >
    {
        return this.fsp.unlink(this._filename).then(() =>
        {
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWritter ' + this.filename + ' got error: ' + err.toString());
            return false;
        });
    }
}