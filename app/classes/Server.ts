import http = require('http');

export interface ServerDelegate
{
	(request: object): Promise < string > ;
}

type PromiseCallback = (arg: string) => void;
type PromiseErrCallback = (arg: Error) => void;

export class Server
{
	constructor(port: number, delegate: ServerDelegate)
	{
		http.createServer((request: http.IncomingMessage, response: http.ServerResponse) =>
		{
			let processor: Promise < Object > ;
			if (request.method === 'GET')
			{
				this.parseGET(request).then((query) =>
				{
					return delegate(
					{
						url: request.url,
						method: request.method,
						query: query
					});
				}).then(res =>
				{
					response.writeHead(200,
					{
						'Content-Type': 'text/plain'
					});
					response.write(res);
					response.end();
				}).catch(err =>
				{
					response.writeHead(400,
					{
						'Content-Type': 'text/plain'
					});
					response.write(err.message);
					response.end();
				});
			}
			else if (request.method === 'POST')
			{
				this.parsePOST(request).then((body) =>
				{
					return delegate(
					{
						url: request.url,
						method: request.method,
						body: body
					});
				}).then(res =>
				{
					response.writeHead(200,
					{
						'Content-Type': 'text/plain'
					});
					response.write(res);
					response.end();
				}).catch(err =>
				{
					response.writeHead(400,
					{
						'Content-Type': 'text/plain'
					});
					response.write(err.message);
					response.end();
				});
			}
			else return response.end();

		}).listen(port);
	}

	private parseGET(request: http.IncomingMessage): Promise < Object >
	{
		if (!request.url) return Promise.resolve('');

		const hashes = request.url.slice(request.url.indexOf("?") + 1).split("&");
		const data = hashes.reduce((params: object, hash: string) =>
		{
			const split = hash.indexOf("=");

			if (split < 0)
			{
				return Object.assign(params,
				{
					[hash]: null
				});
			}

			const key = hash.slice(0, split);
			const val = hash.slice(split + 1);

			return Object.assign(params,
			{
				[key]: decodeURIComponent(val)
			});
		},
		{});

		return Promise.resolve(data);
	}

	private parsePOST(request: http.IncomingMessage): Promise < Object >
	{
		if (!request.headers['content-type'])
		{
			return Promise.reject(new Error('Request has no content type header'));
		}
		if (request.headers['content-type'].toLowerCase() !== 'application/json')
		{
			return Promise.reject(new Error('Request was not JSON'));
		}
		return new Promise((resolve: PromiseCallback, reject: PromiseErrCallback) =>
		{
			let body = '';
			request.on('data', chunk =>
			{
				body += chunk.toString();
			});
			request.on('end', () =>
			{
				resolve(JSON.parse(body));
			});
		});
	}
}