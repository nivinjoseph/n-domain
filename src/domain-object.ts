import { Serializable } from "@nivinjoseph/n-util";

// public
export abstract class DomainObject<TData extends object = {}> extends Serializable<TData>
{
    /**
     * @param value (the value to compare)
     */
    public equals(value: DomainObject | null): boolean
    {
        if (value == null)
            return false;
        
        if (value === this)
            return true;
        
        if ((<Object>value).getTypeName() !== (<Object>this).getTypeName())
            return false;
        
        return JSON.stringify(this.serialize()) === JSON.stringify(value.serialize());
    }
}