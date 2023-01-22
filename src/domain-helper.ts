// import { Uuid } from "@nivinjoseph/n-util";
import { given } from "@nivinjoseph/n-defensive";
// import { ulid } from "ulid";
import { monotonicFactory } from "ulid";
const ulid = monotonicFactory();

// public
export class DomainHelper
{
    public static get now(): number { return Date.now(); }


    // public static generateId(prefix: string): string
    // {
    //     given(prefix, "prefix").ensureHasValue().ensureIsString()
    //         .ensure(t => t.trim().length === 3, "should be 3 chars long")
    //         .ensure((t) => t.matchesFormat("@@@"), "should contain only alphabet chars");
        
    //     // 4 + 32 = 36
    //     return `${prefix.trim().toLowerCase()}_${Uuid.create().replaceAll("-", "")}`;
    // }
    
    public static generateId(prefix: string): string
    {
        given(prefix, "prefix").ensureHasValue().ensureIsString()
            .ensure(t => t.trim().length === 3, "should be 3 chars long")
            .ensure((t) => t.matchesFormat("@@@"), "should contain only alphabet chars");
        
        const date = new Date();
        const year = date.getUTCFullYear().toString().substring(2);
        const month = ((date.getUTCMonth() + 1) / 100).toFixed(2).split(".").takeLast();
        const day = (date.getUTCDate() / 100).toFixed(2).split(".").takeLast();
        
        const dateValue = `${year}${month}${day}`;
        
        // 4 + 32 = 36
        return `${prefix.trim().toLowerCase()}_${dateValue}${ulid(date.valueOf())}`.toLowerCase();
    }
}