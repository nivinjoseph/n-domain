import { given } from "@nivinjoseph/n-defensive";
import { DomainContext } from "./domain-context.js";


export class ConfigurableDomainContext implements DomainContext
{
    private _userId: string;
    private _organizationId: string;

    public get userId(): string { return this._userId; }
    public set userId(value: string) { this._userId = value; }
    
    public get organizationId(): string { return this._organizationId; }
    public set organizationId(value: string) { this._organizationId = value; }
    
    
    public constructor(userId: string, organizationId: string)
    {
        given(userId, "userId").ensureHasValue().ensureIsString();
        this._userId = userId;
        
        given(organizationId, "organizationId").ensureHasValue().ensureIsString();
        this._organizationId = organizationId;
    }
}

