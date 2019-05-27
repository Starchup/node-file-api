export class PubSubEmitter
{
    private Pubsub = require('google-pubsub-wrapper');
    private _client: any;
    private _env: string;

    constructor(public pubsub_id: string, environment: string)
    {
        this._env = environment;
        this._client = this.Pubsub.init(pubsub_id);
    }

    /* Private methods */
    public send(topic: string, data: string): void
    {
        const config = {
            env: this._env,
            topicName: topic
        };
        this._client.emit(data, config);
    }
}