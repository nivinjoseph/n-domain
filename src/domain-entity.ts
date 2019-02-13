import { DomainObject } from "./domain-object";
import { given } from "@nivinjoseph/n-defensive";

// public
export abstract class DomainEntity extends DomainObject
{
    private readonly _id: string;
    
    
    public get id(): string { return this._id; }
    
    
    protected constructor(id: string)
    {
        super();
        
        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
}