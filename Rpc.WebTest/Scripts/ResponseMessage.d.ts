import { IResponseMessage } from "./IResponseMessage";

interface ResponseMessage extends IResponseMessage {
    successful: boolean;
    response: any;
    id: string;
}