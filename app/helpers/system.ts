import
{
    spawn
}
from 'child_process';

type PromiseCallback = () => void;
type PromiseErrCallback = (arg: Error) => void;


export function createGroup(groupname: string, password: string): Promise < void >
{
    return adduser(groupname).then(res =>
    {
        return passwd(groupname, password);
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