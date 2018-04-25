import { IMessage } from "./IMessage";

export interface IResponseMessage extends IMessage {
    successful: boolean;
    response: any;
}