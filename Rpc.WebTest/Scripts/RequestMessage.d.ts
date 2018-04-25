import { IRequestMessage } from "./IRequestMessage";

interface RequestMessage extends IRequestMessage {
    methodName: string;
    methodArguments: any[];
    id: string;
}
