type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;

export class FileWriter
{
    private os = require('os');
    private fs = require('fs');
    private fsp = this.fs.promises;

    private _filePermissions: string = '760';

    private _uid: number;
    private _gid: number;
    private _fileName: string;

    constructor(public fileName: string, gid: number)
    {
        process.umask(0);

        this._fileName = fileName;
        this._gid = gid;
        this._uid = this.os.userInfo().uid;

        const res = this.setupDirectories();
        if (!res) throw new Error('Could not setup directories for ' + this._fileName);
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
            this.fs.accessSync(this._fileName, this.fs.F_OK);
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
            this.fs.accessSync(this._fileName, this.fs.W_OK);
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

        return this.fsp.appendFile(this._fileName, data).then(() =>
        {
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWriter ' + this.fileName + ' got appendFile error: ' + err.toString());
            return false;
        });
    }

    private deleteFile(): Promise < boolean >
    {
        return this.fsp.unlink(this._fileName).then(() =>
        {
            return true;
        }).catch((err: Error) =>
        {
            console.error('FileWriter ' + this.fileName + ' got deleteFile error: ' + err.toString());
            return false;
        });
    }

    // Directory helpers
    private setupDirectories(): boolean
    {
        if (this.locationExistsSync(this._fileName) || this._fileName.indexOf('/') < 0)
        {
            return true;
        }

        const directories = this._fileName.split('/');
        if (directories.length < 2)
        {
            throw new Error('Could not create subdirectories for fileName ' + this._fileName);
        }

        const directoryWithoutfileName = directories.slice(0, directories.length - 1).join('/');
        if (this.locationExistsSync(directoryWithoutfileName))
        {
            return true;
        }

        directories.forEach((d: string, idx: number) =>
        {
            if (idx === directories.length - 1 || d === '.') return;
            this.makeDirectorySync(
                directories.slice(0, idx + 1).join('/'),
                this._uid,
                this._gid,
                this._filePermissions);
        });

        return this.fileWrittableSync();
    }

    private makeDirectorySync(pathName: string, uid: number, gid: number, permissions: string): void
    {
        this.fs.mkdirSync(pathName, permissions);
        this.fs.chownSync(pathName, uid, gid);
    }
}