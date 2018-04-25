import { Rpc } from "./Rpc";
import { RequestMessage } from "./RequestMessage";
import { ResponseMessage } from "./ResponseMessage";
import * as guid from 'uuid/v4';
import { IMessage } from "./IMessage";
import { IResponseMessage } from "./IResponseMessage";
import { IRequestMessage } from "./IRequestMessage";


export class WebSocketRpc {
    private _rpc: Rpc<ResponseMessage, RequestMessage>;
    private _ws: WebSocket;

    constructor(private _url: string) {
    }

    start() {
        this._ws = new WebSocket(this._url);
        this._ws.onmessage = (evt) => {
            if (typeof evt.data === 'string') {
                this.onReceive(JSON.parse(evt.data));
            } else {
                this.onReceive(evt.data);
            }
        }

        this._rpc = new Rpc<ResponseMessage, RequestMessage>((m) => this.send(m), () => guid())
        this._rpc.registerMethod(this, 'getB', this.getB);
    }

    send(data: any): Promise<void> {
        this._ws.send(JSON.stringify(data));
        return new Promise<void>((resolve, _) => resolve());
    }

    onReceive(data: any) {
        if (data['response']) {
            this._rpc.processResponseMessage(data as IResponseMessage);
        } else {
            this._rpc.processRequestMessage(data as IRequestMessage);
        }
    }

    call(methodName: string, args: any[]): Promise<any> {
        return this._rpc.call(methodName, args);
    }

    getB() {
        return parseInt((document.getElementById('b-input') as HTMLInputElement).value);
    }
}

window['WebSocketRpc'] = WebSocketRpc;