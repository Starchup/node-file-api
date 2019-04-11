interface FSStatObject
{
    [gid: string]: number;
}

interface FSError
{
    [code: string]: string;
}

export class ShareManager
{
    private os = require('os');
    private fs = require('fs');
    private fsp = this.fs.promises;

    private uid = this.os.userInfo().uid;
    private permissions = '760';

    private systemHelper = require('../helpers/system');

    /* Public methods */
    public setupShare(path: string, username: string, password: string): Promise < boolean >
    {
        return this.getGroupId(username).then(gid =>
        {
            if (!gid) return this.createGroupId(username, password);
            else return gid;
        }).then(gid =>
        {
            if (!gid) throw new Error();

            return this.directoryIsSetup(path, gid).then(directoryIsSetup =>
            {
                if (directoryIsSetup) return true;
                return this.setupDirectory(path, gid);
            }).then((res) =>
            {
                if (!res) throw new Error('Could not setup directory ' + path);
            });
        }).then(() =>
        {
            const splitPath = path.split('/');
            const basePath = splitPath.slice(0, splitPath.length - 1).join('/');
            return this.systemHelper.isSMBShareSetup(username, basePath).then((isSetup: boolean) =>
            {
                if (!isSetup) return this.systemHelper.createSMBShare(username, basePath);
            });
        }).catch(() =>
        {
            return false;
        });
    }

    /**
     * Private helpers
     */
    private directoryIsSetup(path: string, gid: number): Promise < boolean >
    {
        return this.directoryIsWritable(path).then((isWritable: boolean) =>
        {
            if (isWritable) return this.directoryHasOwnerAndGroup(path, gid);
            else return false;
        }).then((res: boolean) =>
        {
            return !!res;
        });
    }

    private directoryIsWritable(path: string): Promise < boolean >
    {
        return this.fsp.access(path, this.fs.W_OK).then(() =>
        {
            return true;
        });
    }

    private setupDirectory(path: string, gid: number): Promise < boolean >
    {
        process.umask(0);

        const directories = path.split('/');

        return directories.reduce((prev, curr, idx) =>
        {
            return prev.then(() =>
            {
                //If the path has a . at the beginning, or if the path has a file extension, exit
                if (curr.indexOf('.') > -1) return Promise.resolve();

                const currPath = directories.slice(0, idx + 1).join('/');
                return this.makeDir(currPath, gid).then((res: boolean) =>
                {
                    if (res) return this.chownDir(currPath, gid);
                    else return false;
                }).then(() =>
                {});
            });
        }, Promise.resolve()).then(() =>
        {
            return true;
        }).catch(() =>
        {
            return false;
        });
    }

    private makeDir(path: string, gid: number): Promise < boolean >
    {
        return this.fsp.mkdir(path, this.permissions).then(() =>
        {
            return true;
        }).catch((err: FSError) =>
        {
            if (err.code === 'EEXIST') return true;

            console.error('ShareManager makeDir got error: ' + err.toString());
            return false;
        });
    }

    private chownDir(path: string, gid: number): Promise < boolean >
    {
        return this.fsp.chown(path, this.uid, gid).then(() =>
        {
            return true;
        }).catch((err: Error) =>
        {
            console.error('ShareManager chownDir got error: ' + err.toString());
            return false;
        });
    }

    private directoryHasOwnerAndGroup(path: string, gid: number): Promise < boolean >
    {
        return this.fsp.stat(path, this.fs.W_OK).then((stat: FSStatObject) =>
        {
            return stat.gid === gid;
        }).catch(() =>
        {
            return false;
        });
    }

    private getGroupId(groupName: string): Promise < number >
    {
        return this.fsp.readFile('/etc/group').then((data: string) =>
        {
            const groups = data.toString().split('\n');
            if (!groups || groups.length < 1) return;

            const group = groups.find(g =>
            {
                return g.indexOf(groupName) === 0;
            });
            if (!group || group.length < 1) return;

            const groupId = group.split(':')[2];
            if (!groupId) return;

            return parseInt(groupId);

        }).catch((err: Error) =>
        {
            console.error('ShareManager getGroupId got error: ' + err.toString());
        });
    }

    private createGroupId(groupname: string, password: string): Promise < number >
    {
        return this.systemHelper.createGroup(groupname, password).then(() =>
        {
            return this.getGroupId(groupname);
        });
    }
}