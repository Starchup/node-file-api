import
{
	ShareManager
}
from "./classes/ShareManager";

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
const emitter: PubSubEmitter = new PubSubEmitter(process.env.GCLOUD_PROJECT, process.env.NODE_ENV);
const shareManager: ShareManager = new ShareManager();

const readers: ReaderList = {};
const writers: WriterList = {};

const refreshRate = 100; // 10th of a second

/**
 * Main server implementation
 */
const server = new Server(process.env.FILE_API_PORT, (request: any) =>
{
	// Handle healthcheck/status method
	if (request.method === 'GET' && request.url === '/')
	{
		// TODO - Do something uesful like check the mysql connection or file IO is up and running
		return Promise.resolve('OK');
	}

	// File writing request handling
	// - when asked, the service will write a line of text to the given file
	if (request.method === 'POST' && request.url.indexOf('/writeFile') > -1)
	{
		if (!request.body.directory) throw new Error('watchFile requires directory');
		if (!request.body.filename) throw new Error('watchFile requires filename');
		if (!request.body.data) throw new Error('watchFile requires data');

		let writer: FileWriter = writers[request.body.directory];
		if (!writer)
		{
			writer = new FileWriter(filePath(request.body.directory), request.body.filename);
			writers[request.body.directory] = writer;
		}

		return writer.writeData(request.body.data)
			.then((result: boolean) =>
			{
				if (result) return 'OK';
				else throw new Error('Could not write to file');
			}).catch(err =>
			{
				console.error('Server /writeFile Error: ' + err.message);
				throw err;
			});
	}

	// File writing request handling
	// - when asked, the service will setup a shared SAMBA directory and file system
	//   for the specified username & password
	if (request.method === 'POST' && request.url.indexOf('/setupShare') > -1)
	{
		if (!request.body.directory) throw new Error('setupShare requires directory');
		if (!request.body.filename) throw new Error('setupShare requires filename');
		if (!request.body.username) throw new Error('setupShare requires username');
		if (!request.body.password) throw new Error('setupShare requires password');

		const path: string = filePath(request.body.directory);
		return shareManager.setupShare(path, request.body.username, request.body.password)
			.then((result: boolean) =>
			{
				if (!result) throw new Error('Could not setup share');

				if (!readers[request.body.directory])
				{
					readers[request.body.directory] = new FileWatcher(
						filePath(request.body.directory),
						request.body.filename,
						refreshRate,
						(data: string, serialNumber: string) =>
						{
							// When file reader polling sees a new line in the file, it reads it
							// and returns it here everytime so we can send it to pubsub for other services to consume
							emitter.send(request.body.directory,
							{
								data: data,
								serialNumber: serialNumber
							});
						});
				}

				return 'OK';
			}).catch(err =>
			{
				console.error('Server /setupShare Error: ' + err.message);
				throw err;
			});
	}

	throw new Error('Method or URL invalid');
});

const filePath = function (fileName: string): string
{
	return process.env.FILE_API_DIRECTORY + '/' + fileName;
}