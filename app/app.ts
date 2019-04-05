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

import
{
	PubSubEmitter
}
from "./classes/PubSubEmitter";


/**
 * Interfaces and local definitions
 */
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
		NODE_ENV: string,
		FILE_API_PORT: number,
		GCLOUD_PROJECT: string,
		FILE_API_DIRECTORY: string
	}
}

if (!process.env.NODE_ENV || process.env.NODE_ENV.length < 1) throw new Error('NODE_ENV is required');
if (!process.env.FILE_API_PORT || process.env.FILE_API_PORT < 0) throw new Error('FILE_API_PORT is required');
if (!process.env.GCLOUD_PROJECT || process.env.GCLOUD_PROJECT.length < 1) throw new Error('GCLOUD_PROJECT is required');
if (!process.env.FILE_API_DIRECTORY || process.env.FILE_API_DIRECTORY.length < 1) throw new Error('FILE_API_DIRECTORY is required');

/**
 * Global variables
 */
const emitter: PubSubEmitter = new PubSubEmitter(process.env.GCLOUD_PROJECT);

const readers: ReaderList = {};
const writers: WriterList = {};

/**
 * Main server implementation
 */
const server = new Server(process.env.FILE_API_PORT, (request: any) =>
{
	// Handle Status method
	if (request.method === 'GET' && request.url === '/')
	{
		return Promise.resolve('OK');
	}

	// File watching request handling
	if (request.method === 'POST' && request.url === '/watchFile')
	{
		if (!request.body.fileName) throw new Error('watchFile requires fileName');

		if (!readers[request.body.fileName])
		{
			new FileWatcher(filePath(request.body.fileName), (data: string) =>
			{
				emitter.send(process.env.NODE_ENV, request.body.fileName, data);
			});
		}
		return Promise.resolve('OK');
	}

	// File writing request handling
	if (request.method === 'POST' && request.url === '/writeFile')
	{
		if (!request.body.fileName) throw new Error('watchFile requires fileName');
		if (!request.body.data) throw new Error('watchFile requires data');

		let writer: FileWriter = writers[request.body.fileName];
		if (!writer)
		{
			writer = new FileWriter(filePath(request.body.fileName));
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

const filePath = function (fileName: string): string
{
	return process.env.FILE_API_DIRECTORY + '/' + fileName;
}