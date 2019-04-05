NodeJS IO to API converter
================

#### Synopsis

The NFA is meant to be a modern interface for the old IO API that consisted of writting and reading files to a shared directory. This NodeJS API will translate those file IO operations from and to JSON through API endpoints and with Google pubsub.

#### Environment Variables
`FILE_API_PORT` to define it's port
`FILE_API_DIRECTORY` to define the directory where the files need to go (without trailing slash.. so ex: /var/www)

#### Running the app
`npm run dev` or `npm run prod`

##### Sending data:
POST data to the API and NFA will write those commands to a file. Behind the scenes, in order to achieve maximum consistency, NFA will put those commands to a queue, to be later consumed by the file IO system one after the other.

##### Receiving data:
Data received in files will be sent to clients using Google Pubsub.