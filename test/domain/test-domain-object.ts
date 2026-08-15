import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject, DomainObjectData } from "../../src/index.js";


@serialize("Test")
export class TestDomainObject extends DomainObject<TestDomainObject, "id" | "name">
{
    private readonly _id: string;
    private readonly _name: string;
    
    
    @serialize
    public get id(): string { return this._id; }
    
    @serialize
    public get name(): string { return this._name; }
    
    
    public constructor(data: DomainObjectData<TestDomainObject>)
    {
        super(data);
        
        const { id, name } = data;
        
        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
        
        given(name, "name").ensureHasValue().ensureIsString();
        this._name = name;
    }
    
    // public static deserialize(data: Serialized): TestDomainObject
    // {
    //     given(data, "data").ensureHasValue().ensureIsObject();
        
    //     return new TestDomainObject(data.id, data.name);
    // }
    
    // public serialize(): Serialized
    // {
    //     return {
    //         id: this._id,
    //         name: this._name
    //     };
    // }
    
    public updateName(name: string): TestDomainObject
    {
        given(name, "name").ensureHasValue().ensureIsString();
        
        return new TestDomainObject({id: this._id, name});
    }
}