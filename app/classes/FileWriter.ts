type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;

export class FileWriter
{
    private fs = require('fs');
    private fsp = this.fs.promises;
    private moment = require('moment');

    private _directoryName: string;
    private _fileName: string;

    constructor(directoryName: string, fileName: string)
    {
        this._directoryName = directoryName;
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
            this.fs.accessSync(this._directoryName, this.fs.W_OK);
        }
        catch (e)
        {
            return false;
        }
        return true;
    }

    // File helpers
    private writeFile(data: string): Promise < boolean >
    {
        if (data.indexOf('\n') < 0) data = '\n' + data;

        const timestampedFileName = this.moment().format(this._fileName)
        const fullPath = this._directoryName + '/' + timestampedFileName;

        return this.fsp.appendFile(fullPath, data).then((err: Error) =>
        {
            if (err) throw new Error(err.toString());
            console.debug('writeFile to ' + fullPath + ' success: ' + data);
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWriter ' + fullPath + ' got appendFile error: ' + err.toString());
            return false;
        });
    }
}