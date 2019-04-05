import
{
	FileWatcher,
	FileWatcherDelegate
}
from "./classes/FileWatcher";
import
{
	FileWriter
}
from "./classes/FileWriter";

import
{
	Server,
	ServerDelegate
}
from "./classes/Server";

interface WriterList
{
	[key: string]: FileWriter;
}
interface ReaderList
{
	[key: string]: FileWatcher;
}

declare var process:
{
	env:
	{
		FILE_API_PORT: number
	}
}

const readers: ReaderList = {};
const writers: WriterList = {};

const server = new Server(process.env.FILE_API_PORT, (request: any) =>
{
	if (request.method === 'GET' && request.url === '/')
	{
		return Promise.resolve('OK');
	}
	if (request.method === 'POST' && request.url === '/watchFile')
	{
		if (!request.body.fileName) throw new Error('watchFile requires fileName');

		if (!readers[request.body.fileName])
		{
			new FileWatcher(request.body.fileName, (data: string) =>
			{
				console.error('Server watchFile read data: ' + data);
			});
		}
		return Promise.resolve('OK');
	}
	if (request.method === 'POST' && request.url === '/writeFile')
	{
		if (!request.body.fileName) throw new Error('watchFile requires fileName');
		if (!request.body.data) throw new Error('watchFile requires data');

		let writer: FileWriter = writers[request.body.fileName];
		if (!writer)
		{
			writer = new FileWriter(request.body.fileName);
			writers[request.body.fileName] = writer;
		}

		return writer.writeData(request.body.data).then((result: boolean) =>
		{
			if (result) return 'OK';
			else throw new Error('Could not write to file');
		}).catch(err =>
		{
			console.error('Server /writeFile Error: ' + err.message);
			throw err;
		});
	}

	throw new Error('Method or URL invalid');
});