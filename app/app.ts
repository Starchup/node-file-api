// lib/app.ts
import express = require("express");
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

// Create a new express application instance
const app: express.Application = express();


const testRead = new FileWatcher('test.txt', (data) =>
{
	console.log('got delegate data');
	console.log(data);
});

const testWrite = new FileWritter('test.txt');


app.get("/", (req, res) =>
{
	testWrite.writeData(req.query.data).then((result) =>
	{
		res.send("Result: " + result);
	});
});

app.listen(3000);