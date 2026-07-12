import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainEntity } from "../../src/index.js";


@serialize("Test")
export class TestDomainEntity extends DomainEntity
{
    private readonly _name: string;


    @serialize
    public get name(): string { return this._name; }


    public constructor(data: Data)
    {
        super(data);

        const { name } = data;

        given(name, "name").ensureHasValue().ensureIsString();
        this._name = name;
    }

    public updateName(name: string): TestDomainEntity
    {
        given(name, "name").ensureHasValue().ensureIsString();

        return new TestDomainEntity({ id: this.id, name });
    }
}


interface Data
{
    id: string;
    name: string;
}
