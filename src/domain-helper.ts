
import "@nivinjoseph/n-ext";
import { Uuid } from "@nivinjoseph/n-util";

// public
export class DomainHelper
{
    public static get now(): number { return Date.now(); }


    public static generateId(): string
    {
        return Uuid.create().replaceAll("-", "");
    }
}