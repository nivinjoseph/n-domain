import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "./domain-object.js";

// public
export abstract class DomainEntity<TData extends object = {}> extends DomainObject<TData>
{
    private readonly _id: string;


    @serialize
    public get id(): string { return this._id; }


    protected constructor(data: Pick<DomainEntity, "id">)
    {
        super(data as any);

        const { id } = data;

        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
}