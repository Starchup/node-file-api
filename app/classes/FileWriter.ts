type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;

export class FileWriter
{
    private fs = require('fs');
    private fsp = this.fs.promises;

    private _fileName: string;

    constructor(fileName: string)
    {
        this._fileName = fileName;

        const fileWritable = this.fileWritableSync();
        if (!fileWritable) throw new Error('FileWriter file not writable ' + this._fileName);
    }

    /* Private methods */
    public writeData(data: string): Promise < boolean >
    {
        if (this.fileWritableSync()) return this.writeFile(data);

        return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
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

    /**
     * Private helpers
     */
    private fileWritableSync(): boolean
    {
        try
        {
            this.fs.accessSync(this._fileName, this.fs.W_OK);
        }
        catch (e)
        {
            if (e.code === 'ENOENT') return true;
            return false;
        }
        return true;
    }

    // File helpers
    private writeFile(data: string): Promise < boolean >
    {
        if (data.indexOf('\n') < 0) data = '\n' + data;

        return this.fsp.appendFile(this._fileName, data).then((err: Error) =>
        {
            if (err) throw new Error(err.toString());
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWriter ' + this.fileName + ' got appendFile error: ' + err.toString());
            return false;
        });
    }
}