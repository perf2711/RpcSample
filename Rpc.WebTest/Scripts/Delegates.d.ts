import { IMessage } from "./IMessage";

export type SendHandler = (message: IMessage) => Promise<void>;
export type CreateKeyHandler = () => string;