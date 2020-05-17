import { DomainObject } from "./domain-object";
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";

// public
export abstract class DomainEntity extends DomainObject
{
    private readonly _id: string;
    
    @serialize()
    public get id(): string { return this._id; }
    
    
    protected constructor({ id }: {id: string})
    {
        super();
        
        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
}