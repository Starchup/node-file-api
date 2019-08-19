export interface FileWatcherDelegate
{
    (message: string, serialNumber: string): void;
}

export class FileWatcher
{
    private moment = require('moment');
    private fs = require('fs');
    private fsp = this.fs.promises;

    constructor(directory: string, fileName: string, refreshRate: number, delegate: FileWatcherDelegate)
    {
        const formatWithoutEscapeChars: string = fileName.replace(/\[|\]/g, '');

        const extensionIndex: number = formatWithoutEscapeChars.indexOf('.');
        const fileExtension: string = formatWithoutEscapeChars.substring(extensionIndex);

        const serialNumberSequence: number = formatWithoutEscapeChars.indexOf('_D:');

        let serialNumberStart: number;
        let serialNumberEnd: number;
        if (serialNumberSequence > -1)
        {
            const serialNumberInfoStart: number = serialNumberSequence + 3;
            const serialNumberInfoEnd: number = serialNumberSequence + 4;

            serialNumberStart = serialNumberSequence + 1;
            serialNumberEnd = serialNumberSequence + 1 + parseInt(formatWithoutEscapeChars.substring(serialNumberInfoStart, serialNumberInfoEnd));
        }

        setInterval(() =>
        {
            const inFiles: Array < string > = this.listFilesSync(directory).filter((f: string) =>
            {
                return f.indexOf(fileExtension) > -1;
            });
            if (inFiles.length < 1) return;

            let earliestFile: string = inFiles[0];
            if (inFiles.length > 1) inFiles.forEach((f: string, idx: number) =>
            {
                const fDate = this.moment(f, fileName);
                if (!this.moment(fDate, fileName).isValid()) return;

                const earliestDate = this.moment(earliestFile, fileName);
                if (fDate.isBefore(earliestDate)) earliestFile = f;
            });

            let serialNumber: string = '';
            if (serialNumberStart && serialNumberEnd)
            {
                serialNumber = earliestFile.substring(serialNumberStart, serialNumberEnd);
            }

            this.checkReadDeleteCycle(directory + '/' + earliestFile, delegate, serialNumber);
        }, refreshRate);
    }

    /* Private helpers */
    private checkReadDeleteCycle(filePath: string, delegate: FileWatcherDelegate, serialNumber: string, ): void
    {
        if (!this.fileReadableSync(filePath)) return;

        this.readFile(filePath).then((data: string) =>
        {
            return this.deleteFile(filePath).then(() =>
            {
                return delegate(data.toString(), serialNumber);
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