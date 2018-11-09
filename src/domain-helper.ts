import { Uuid } from "@nivinjoseph/n-sec";
import "@nivinjoseph/n-ext";

// public
export class DomainHelper
{
    public static get now(): number { return Date.now(); }


    public static generateId(): string
    {
        return Uuid.create().trim().replaceAll(" ", "").replaceAll("-", "").toLowerCase();
    }
}