import * as types from "discord-api-types/v10";
import * as constants from "./constants";

export class GatewayClient {
    public shards: Shard[];
    private token: string;
    private intents: number;

    constructor(token: string) {
        this.shards = [];
        this.token = token;
        this.intents = 0;
    }
    public async connect(options: constants.GatewayConnectOptions): Promise<boolean> {
        this.intents = options.intents;
        let startInfo: types.APIGatewayBotInfo = await (await fetch(`${constants.API_URL}/gateway/bot`, {
            headers: {
                "Authentication": `Bot ${this.token}`
            }
        })).json();
        for (let i = 0; i < startInfo.shards; i++) {
            this.shards.push(new Shard());
            await this.shards[i].connect({token: this.token, intents: this.intents}, [i, startInfo.shards]);
        }
    }
    public async disconnect(): Promise<void> {
        // implement discord gateway disconnection
    }
    public async rawSend(data: any): Promise<boolean> {
        // implement command sender
    }
    public on(event: types.GatewayDispatchEvents, callback: (...args: any[]) => void): void {
        // implement event handler
    }
}

export class Shard {
    private ws: WebSocket | null;
    private heartbeat_interval: number;
    private last_sequence: number | null;
    private last_heartbeat_acked: boolean;
    private shard_id: number;

    constructor() {
        this.ws = null;
        this.heartbeat_interval = 0;
        this.last_sequence = null;
        this.last_heartbeat_acked = true;
        this.shard_id = 0;
    }
    public async connect(options: {token: string, intents: number}, shardInfo: [number, number], resume = false): Promise<void> {
        this.ws = new WebSocket(constants.GATEWAY_URL);
        this.ws.addEventListener("message", (msg) => {
            const data: types.GatewayReceivePayload = JSON.parse(msg.data);
            switch (data.op) {
                case types.GatewayOpcodes.Dispatch: {
                    // handle dispatch
                    break;
                }
                case types.GatewayOpcodes.Heartbeat: {
                    this.heartbeat();
                    break;
                }
                case types.GatewayOpcodes.Hello: {
                    this.heartbeat_interval = data.d.heartbeat_interval;
                    setTimeout(() => {
                        if (this.ws) {
                            this.heartbeat();
                            setInterval(this.heartbeat, this.heartbeat_interval);
                            this.ws.send(JSON.stringify({
                                op: types.GatewayOpcodes.Identify,
                                d: {
                                    token: options.token,
                                    intents: options.intents,
                                    properties: {
                                        os: process.platform,
                                        browser: "ovencord",
                                        device: "ovencord"
                                      }
                                }
                            }));
                        }
                    }, this.heartbeat_interval*Math.random());
                    break;
                }
                case types.GatewayOpcodes.HeartbeatAck: {
                    this.last_heartbeat_acked = true;
                    break;
                }
            }
        });
        this.ws.addEventListener("close", (msg) => {
            
        })
    }
    private async heartbeat(): Promise<void> {
        if (this.ws) {
            if (this.last_heartbeat_acked) {
                this.ws.send(JSON.stringify({
                    op: 1,
                    d: this.last_sequence
                }));
            } else {
                this.ws.close(1002, "bad connection")
                console.log(`Shard ${this.shard_id} has disconnected due to a bad connection! Closing and attempting to resume...`);
                // reconnect
            }
        }
    }
    public async disconnect(): Promise<void> {
        // implement shard disconnection
    }
    public async rawSend(data: any): Promise<void> {
        // implement shard command sender
    }
}