import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject, DomainObjectData } from "./domain-object.js";

// public
export abstract class DomainEntity<TThis extends { id: string; }, TDataKeys extends keyof TThis> extends DomainObject<TThis, TDataKeys | "id">
{
    private readonly _id: string;


    @serialize
    public get id(): string { return this._id; }


    protected constructor(data: DomainObjectData<DomainEntity<TThis, TDataKeys>>)
    {
        super(data);

        // the mapped type is opaque while TThis is unresolved, but "id" is guaranteed in it
        const { id } = data as unknown as { id: string; };

        given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }


    /**
     * Entities are compared by identity, not state.
     * @param value (the value to compare)
     */
    public override equals(value: DomainObject<object, never> | null | undefined): boolean
    {
        if (value == null)
            return false;

        if (value === this)
            return true;

        if (value.getTypeName() !== this.getTypeName())
            return false;

        return (value as DomainEntity<{ id: string; }, never>).id === this._id;
    }

    /**
     * Entities are compared by state, including identity.
     * @param value (the value to compare)
     */
    public deepEquals(value: DomainObject<object, never> | null | undefined): boolean
    {
        return super.equals(value);
    }
}