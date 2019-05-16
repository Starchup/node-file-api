import
{
    spawn
}
from 'child_process';

const fs = require('fs');

type PromiseCallback = () => void;
type PromiseDataCallback = (data: string) => void;
type PromiseErrCallback = (arg: Error) => void;


const _sambaConf = '/etc/samba/smb.conf';


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
    return appendToFile(_sambaConf, '[' + groupname + ']').then(res =>
    {
        return appendToFile(_sambaConf, 'path = ' + path);
    }).then(res =>
    {
        return appendToFile(_sambaConf, 'valid users = ' + groupname);
    }).then(res =>
    {
        return appendToFile(_sambaConf, 'read only = no');
    }).then(res =>
    {
        return appendToFile(_sambaConf, '\n');
    });
}

export function isSMBShareSetup(groupname: string, path: string): Promise < boolean >
{
    return readFile(_sambaConf).then(data =>
    {
        const hasDefinition: boolean = !!data.split('\n').find(line =>
        {
            return line === '[' + groupname + ']';
        });
        const hasCorrectPath: boolean = !!data.split('\n').find(line =>
        {
            return line === 'path = ' + path;
        });
        return hasDefinition && hasCorrectPath;
    });
}

export function setDirectoryPermissions(path: string, permissions: string): Promise < void >
{
    return runNoIOCommand('chmod', [permissions, path]);
}


function adduser(username: string): Promise < void >
{
    return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
    {
        const child = spawn('adduser', ['-D', '-g', '""', username]);
        child.stderr.on('data', (error) =>
        {
            reject(Error(error.toString()));
        });

        child.stderr.on('error', (error) =>
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
            if (data.toString().indexOf('New password:') > -1 ||
                data.toString().indexOf('Retype new password:') > -1 ||
                data.toString().indexOf('Enter new UNIX password:') > -1 ||
                data.toString().indexOf('Retype new UNIX password:') > -1)
            {
                child.stdin.write(password + '\n');
            }
            else if (data.toString().indexOf('password updated successfully') < 0)
            {
                reject(Error(data.toString()));
            }
        });

        child.stderr.on('error', (error) =>
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

        child.stderr.on('error', (error) =>
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

        child.stderr.on('error', (error) =>
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

function readFile(filepath: string): Promise < string >
{
    return new Promise((resolve: PromiseDataCallback, reject: PromiseErrCallback) =>
    {
        fs.readFile(filepath, (err: Error, data: string) =>
        {
            if (err) reject(err);
            else resolve(data.toString());
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