import { Serializable } from "@nivinjoseph/n-util";

// public
export abstract class DomainObject<TData extends object = object> extends Serializable<TData>
{
    /**
     * @param value (the value to compare)
     */
    public equals(value: DomainObject | null | undefined): boolean
    {
        if (value == null)
            return false;
        
        if (value === this)
            return true;
        
        if (value.getTypeName() !== this.getTypeName())
            return false;
        
        return JSON.stringify(this.serialize()) === JSON.stringify(value.serialize());
    }
}