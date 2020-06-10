import { DomainObject } from "./domain-object";
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";

// public
export abstract class DomainEntity extends DomainObject
{
    private readonly _id: string;
    
    
    @serialize()
    public get id(): string { return this._id; }
    
    
    protected constructor(data: Pick<DomainEntity, "id">)
    {
        super();
        given(data, "data").ensureHasValue().ensureIsObject();
        
        const { id } = data;
        
        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
}