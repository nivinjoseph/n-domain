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
            .ensure(t => t.trim().length === 3, "should be 3 chars long")
            .ensure((t) => t.matchesFormat("@@@"), "should contain only alphabet chars");
        
        // 4 + 32 = 36
        return `${prefix.trim().toLowerCase()}_${Uuid.create().replaceAll("-", "")}`;
    }
}