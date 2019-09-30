type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;

export class FileWriter
{
    private fs = require('fs');
    private fsp = this.fs.promises;
    private moment = require('moment');

    private _directoryName: string;
    private _fileName: string;

    private _retryInterval: number = 500; // 500ms
    private _tempFileName: string = 'tempfile.tmp';

    constructor(directoryName: string, fileName: string)
    {
        this._directoryName = directoryName;
        this._fileName = fileName;

        const directoryWritable: boolean = this.directoryWritableSync();
        if (!directoryWritable) throw new Error('FileWriter directory not writable ' + this._fileName);
    }

    /* Private methods */
    public writeData(data: string): Promise < boolean >
    {
        if (this.directoryWritableSync()) return this.writeFile(data);
        if (this.tempFileExistsSync()) return this.writeFile(data);

        return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
        {
            setTimeout(() =>
            {
                resolve();
            }, this._retryInterval);
        }).then(() =>
        {
            return this.writeData(data);
        });
    }

    /**
     * Private helpers
     */
    private directoryWritableSync(): boolean
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
    private tempFileExistsSync(): boolean
    {
        try
        {
            this.fs.accessSync(this._directoryName + '/' + this._tempFileName, this.fs.R_OK);
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
        const fullTempPath = this._directoryName + '/' + this._tempFileName;

        return this.fsp.writeFile(fullTempPath, data).then((err: Error) =>
        {
            if (err) throw new Error(err.toString());

            return this.fsp.rename(fullTempPath, fullPath);
        }).then((err: Error) =>
        {
            if (err) throw new Error(err.toString());

            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWriter ' + fullPath + ' got appendFile error: ' + err.toString() + ' with full data ' + data);
            return false;
        });
    }
}