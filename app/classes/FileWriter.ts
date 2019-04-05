type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;

export class FileWriter
{
    private fs = require('fs');
    private fsp = this.fs.promises;

    private _filename: string;

    constructor(public filename: string)
    {
        this._filename = filename;

        const res = !this.setupDirectories();
        if (!res) throw new Error('Could not setup directories for ' + this._filename);
    }

    /* Private methods */
    public writeData(data: string): Promise < boolean >
    {
        if (this.fileWrittableSync()) return this.writeFile(data);

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

    // Generic IO helpers
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

    private locationExistsSync(path: string): boolean
    {
        try
        {
            this.fs.accessSync(path, this.fs.W_OK);
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

        return this.fsp.appendFile(this._filename, data).then(() =>
        {
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWriter ' + this.filename + ' got appendFile error: ' + err.toString());
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
            console.error('FileWriter ' + this.filename + ' got deleteFile error: ' + err.toString());
            return false;
        });
    }

    // Directory helpers
    private setupDirectories(): boolean
    {
        if (this.locationExistsSync(this._filename) || this._filename.indexOf('/') < 0)
        {
            return true;
        }

        const directories = this._filename.split('/');
        if (directories.length < 2)
        {
            throw new Error('Could not create subdirectories for filename ' + this._filename);
        }

        const directoryWithoutFilename = directories.slice(0, directories.length - 1).join('/');
        if (this.locationExistsSync(directoryWithoutFilename))
        {
            return true;
        }

        directories.forEach((d: string, idx: number) =>
        {
            if (idx === directories.length - 1 || d === '.') return;
            return this.makeDirectory(directories.slice(0, idx + 1).join('/'));
        });

        return this.fileWrittableSync();
    }

    private makeDirectory(pathName: string): void
    {
        this.fs.mkdir(pathName);
    }
}