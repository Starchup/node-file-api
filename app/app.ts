import
{
	FileWatcher,
	FileWatcherDelegate
}
from "./classes/FileWatcher";
import
{
	FileWritter
}
from "./classes/FileWritter";

import
{
	Server,
	ServerDelegate
}
from "./classes/Server";


const server = new Server(3000, (request) =>
{
	if (request.method === 'GET' && request.url === '/')
	{
		return Promise.resolve('OK');
	}
	if (request.method === 'POST' && request.url === '/watchFile')
	{
		return Promise.resolve(JSON.stringify(request.body));
	}
	if (request.method === 'POST' && request.url === '/writeFile')
	{
		return Promise.resolve(JSON.stringify(request.body));
	}

	throw new Error('Method or URL invalid');
});