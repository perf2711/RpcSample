import { SendHandler, CreateKeyHandler } from "./Delegates";
import { IRequestMessage } from "./IRequestMessage";
import { IResponseMessage } from "./IResponseMessage";

type RpcMethod = () => void;
type RpcMethodInfo = { obj: any, method: RpcMethod };
type RpcMethodDictionary = {[key: string]: RpcMethodInfo };
type CallbackDictionary = {[key: string]: { resolve: (result?: any) => void, reject: (reason?: any) => void }};

export class Rpc<TResponseMessage extends IResponseMessage, TRequestMessage extends IRequestMessage>  {
    private _methods: RpcMethodDictionary = {};
    private _callbacks: CallbackDictionary = {};

    constructor(private _sendHandler: SendHandler, private _createKeyHandler: CreateKeyHandler) {
        if (!_sendHandler) {
            throw new Error('Send handler cannot be undefined or null.')
        }
        if (!_createKeyHandler) {
            throw new Error('Create key handler cannot be undefined or null.')
        }
    }

    registerMethod(obj: any, methodName: string, method?: RpcMethod) {
        if (!method) {
            method = obj[methodName];
            if (!method || !(method instanceof Function)) {
                throw new Error(`No method with name ${methodName}.`);
            }
        }
        this._methods[methodName.toLowerCase()] = { obj, method };
    }

    processRequestMessage(message: TRequestMessage) {
        let method =this._methods[message.methodName.toLowerCase()];
        if (!method) {
            this._sendHandler(this.createErrorResponse(message, `No method with name ${message.methodName} found.`))
        }

        try {
            const result = method.method.apply(method.obj, message.methodArguments);
            this._sendHandler(this.createSuccessfulResponse(message, result));
        } catch (err) {
            this._sendHandler(this.createErrorResponse(message, err));
        }
    }

    call(methodName: string, args: any[]): Promise<any> {
        const call = this.createCall(methodName, args);
        return new Promise<any>((resolve, reject) => {
            this._callbacks[call.id] = {resolve, reject};
            this._sendHandler(call);
        });
    }

    processResponseMessage(message: TResponseMessage) {
        const callback = this._callbacks[message.id];
        if (!callback) {
            console.warn(`No callback found with ID ${message.id}.`);
            return;
        }

        if (message.successful) {
            callback.resolve(message.response);
        } else {
            callback.reject(message.response);
        }
    }

    private createCall(methodName: string, args: any[]): TRequestMessage {
        return <TRequestMessage> {
            id: this._createKeyHandler(),
            methodName,
            methodArguments: args
        };
    }

    private createSuccessfulResponse(message: TRequestMessage, response: any): TResponseMessage {
        return <TResponseMessage> {
            id: message.id,
            response,
            successful: true
        };
    }

    private createErrorResponse(message: TRequestMessage, response: any): TResponseMessage {
        return <TResponseMessage> {
            id: message.id,
            response,
            successful: false
        };
    }

}