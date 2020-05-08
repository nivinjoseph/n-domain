import "@nivinjoseph/n-ext";
import { Uuid, Make } from "@nivinjoseph/n-util";
import { given } from "@nivinjoseph/n-defensive";

// public
export class DomainHelper
{
    public static get now(): number { return Date.now(); }


    public static generateId(prefix: string): string
    {
        given(prefix, "prefix").ensureHasValue().ensureIsString()
            .ensure(t => t.trim().length >= 3 && t.trim().length <= 7, "should be between 3 and 7 chars long")
            .ensure(t =>
            {
                const format: string[] = [];
                Make.loop(() => format.push("@"), t.trim().length);
                return t.trim().matchesFormat(format.join(""));
            }, "should contain only alphabet chars");
        
        return `${prefix.trim().toLowerCase()}_${Uuid.create().replaceAll("-", "")}`;
    }
}