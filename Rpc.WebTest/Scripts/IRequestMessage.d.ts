import { IMessage } from "./IMessage";

export interface IRequestMessage extends IMessage {
    methodName: string;
    methodArguments: any[];
}