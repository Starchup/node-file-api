import
{
    spawn
}
from 'child_process';

const fs = require('fs');

type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;


export function createGroup(groupname: string, password: string): Promise < void >
{
    return adduser(groupname).then(res =>
    {
        return passwd(groupname, password);
    }).then(res =>
    {
        return smbpasswd(groupname, password);
    });
}

export function createSMBShare(groupname: string, path: string): Promise < void >
{
    return appendToFile('/etc/samba/smb.conf', '[' + groupname + ']').then(res =>
    {
        return appendToFile('/etc/samba/smb.conf', 'path = ' + path + '/' + groupname)
    }).then(res =>
    {
        return appendToFile('/etc/samba/smb.conf', 'valid users = ' + groupname)
    }).then(res =>
    {
        return appendToFile('/etc/samba/smb.conf', 'read only = no')
    }).then(res =>
    {
        return appendToFile('/etc/samba/smb.conf', '\n')
    }).then(res =>
    {
        return runNoIOCommand('service', ['smbd', 'restart']);
    });
}


function adduser(username: string): Promise < void >
{
    return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
    {
        const child = spawn('adduser', ['--disabled-password', '--gecos', '""', username]);

        child.stderr.on('data', (error) =>
        {
            reject(Error(error.toString()));
        });

        child.on('exit', code =>
        {
            if (code === 0) resolve();
            else reject(new Error('Exit code ' + code));
        });
    });
}

function passwd(username: string, password: string): Promise < void >
{
    return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
    {
        const child = spawn('passwd', [username]);

        child.stderr.on('data', (data) =>
        {
            if (data.toString().indexOf('Enter new UNIX password:') > -1)
            {
                child.stdin.write(password + '\n');
            }
            else if (data.toString().indexOf('Retype new UNIX password:') > -1)
            {
                child.stdin.write(password + '\n');
            }
            else if (data.toString().indexOf('password updated successfully') < 0)
            {
                reject(Error(data.toString()));
            }
        });

        child.on('exit', code =>
        {
            if (code === 0) resolve();
            else reject(new Error('Exit code ' + code));
        });
    });
}

function smbpasswd(username: string, password: string): Promise < void >
{
    return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
    {
        const child = spawn('smbpasswd', ['-a', username]);

        child.stdout.on('data', (data) =>
        {
            if (data.toString().indexOf('New SMB password:') > -1)
            {
                child.stdin.write(password + '\n');
            }
            else if (data.toString().indexOf('Retype new SMB password:') > -1)
            {
                child.stdin.write(password + '\n');
            }
        });

        child.stderr.on('data', (error) =>
        {
            reject(Error(error.toString()));
        });

        child.on('exit', code =>
        {
            if (code === 0) resolve();
            else reject(new Error('Exit code ' + code));
        });
    });
}

function runNoIOCommand(command: string, args: Array < string > ): Promise < void >
{
    return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
    {
        const child = spawn(command, args);

        child.stderr.on('data', (error) =>
        {
            reject(Error(error.toString()));
        });

        child.on('exit', code =>
        {
            if (code === 0) resolve();
            else reject(new Error('Exit code ' + code));
        });
    });
}

function appendToFile(filepath: string, data: string): Promise < void >
{
    if (data.indexOf('\n') < 0) data = '\n' + data;
    return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
    {
        fs.appendFile(filepath, data, (err: Error) =>
        {
            if (err) reject(err);
            else resolve()
        });
    });
}