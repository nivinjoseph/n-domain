import { DomainObject } from "../../src";
import { given } from "@nivinjoseph/n-defensive";


export class TestDomainObject extends DomainObject
{
    private readonly _id: string;
    private readonly _name: string;
    
    
    public get id(): string { return this._id; }
    public get name(): string { return this._name; }
    
    
    public constructor(id: string, name: string)
    {
        super();
        
        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
        
        given(name, "name").ensureHasValue().ensureIsString();
        this._name = name;
    }
    
    public static deserialize(data: Serialized): TestDomainObject
    {
        given(data, "data").ensureHasValue().ensureIsObject();
        
        return new TestDomainObject(data.id, data.name);
    }
    
    public serialize(): Serialized
    {
        return {
            id: this._id,
            name: this._name
        };
    }
    
    public updateName(name: string): TestDomainObject
    {
        given(name, "name").ensureHasValue().ensureIsString();
        
        return new TestDomainObject(this._id, name);
    }
}


interface Serialized
{
    id: string;
    name: string;
}