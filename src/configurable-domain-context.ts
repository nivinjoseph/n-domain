import { given } from "@nivinjoseph/n-defensive";
import { DomainContext } from "./domain-context.js";


export class ConfigurableDomainContext implements DomainContext
{
    private _userId: string;

    public get userId(): string { return this._userId; }
    public set userId(value: string) { this._userId = value; }
    
    
    public constructor(userId: string)
    {
        given(userId, "userId").ensureHasValue().ensureIsString();
        this._userId = userId;
    }
}

