export interface FileWatcherDelegate
{
    (message: string): void;
}

export class FileWatcher
{
    private moment = require('moment');
    private fs = require('fs');
    private fsp = this.fs.promises;

    constructor(directory: string, fileName: string, refreshRate: number, delegate: FileWatcherDelegate)
    {
        let fileIncludesFormat: boolean = false;
        if (fileName.indexOf('YYYYMMDDHHMMSSss') > -1) fileIncludesFormat = true;

        if (!fileIncludesFormat)
        {
            setInterval(() =>
            {
                this.checkReadDeleteCycle(directory + '/' + fileName, delegate);
            }, refreshRate);
        }
        else
        {
            const formatWithoutEscapeChars: string = fileName.replace(/\[|\]/g, '');

            setInterval(() =>
            {
                const inFiles: Array < string > = this.listFilesSync(directory).filter((f: string) =>
                {
                    return f.length === formatWithoutEscapeChars.length && this.moment(f, fileName).isValid();
                });
                if (inFiles.length < 1) return;

                let earliestFile: string = inFiles[0];
                if (inFiles.length > 1) inFiles.forEach((f: string, idx: number) =>
                {
                    const fDate = this.moment(f, fileName);
                    const earliestDate = this.moment(earliestFile, fileName);
                    if (fDate.isBefore(earliestDate)) earliestFile = f;
                });
                this.checkReadDeleteCycle(directory + '/' + earliestFile, delegate);
            }, refreshRate);
        }
    }

    /* Private helpers */
    private checkReadDeleteCycle(filePath: string, delegate: FileWatcherDelegate): void
    {
        if (!this.fileReadableSync(filePath)) return;

        this.readFile(filePath).then((data: string) =>
        {
            return this.deleteFile(filePath).then(() =>
            {
                return delegate(data.toString());
            });
        }).catch((err: Error) =>
        {
            console.error('FileWatcher ' + filePath + ' got error: ' + err.toString());
        });
    }

    private fileReadableSync(fileName: string): boolean
    {
        try
        {
            this.fs.accessSync(fileName, this.fs.R_OK);
        }
        catch (e)
        {
            return false;
        }
        return true;
    }

    private listFilesSync(directoryName: string)
    {
        return this.fs.readdirSync(directoryName)
    }

    private readFile(fileName: string)
    {
        return this.fsp.readFile(fileName);
    }

    private deleteFile(fileName: string)
    {
        return this.fsp.unlink(fileName);
    }
}