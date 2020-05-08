import "@nivinjoseph/n-ext";
import { Uuid } from "@nivinjoseph/n-util";
import { given } from "@nivinjoseph/n-defensive";

// public
export class DomainHelper
{
    public static get now(): number { return Date.now(); }


    public static generateId(prefix: string): string
    {
        given(prefix, "prefix").ensureHasValue().ensureIsString()
            .ensure(t => t.trim().length >= 3 && t.trim().length <= 7, "should be between 3 and 7 chars long");
        
        return `${prefix.trim().toLowerCase()}_${Uuid.create().replaceAll("-", "")}`;
    }
}