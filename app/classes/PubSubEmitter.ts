export class PubSubEmitter
{
    private Pubsub = require('google-pubsub-wrapper');
    private _client: any;

    constructor(public pubsub_id: string)
    {
        this._client = this.Pubsub.init(pubsub_id);
    }

    /* Private methods */
    public send(env: string, topic: string, data: string): void
    {
        const config = {
            env: env,
            topicName: topic
        };
        this._client.emit(data, config);
    }
}