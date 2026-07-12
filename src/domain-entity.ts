import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "./domain-object.js";

// public
export abstract class DomainEntity<TData extends object = object> extends DomainObject<TData>
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


    /**
     * Entities are compared by identity, not state.
     * @param value (the value to compare)
     */
    public override equals(value: DomainObject | null | undefined): boolean
    {
        if (value == null)
            return false;

        if (value === this)
            return true;

        if (value.getTypeName() !== this.getTypeName())
            return false;

        return (value as DomainEntity).id === this._id;
    }
}