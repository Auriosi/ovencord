export interface GatewayConnectOptions {
    token: string;
    intents: number;
    compress?: boolean;
}

export const API_VERSION = 10;
export const GATEWAY_URL = `wss://gateway.discord.gg/?v=${API_VERSION}&encoding=json`;
export const API_URL = `https://discord.com/api/v${API_VERSION}`;