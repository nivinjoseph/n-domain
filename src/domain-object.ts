import "@nivinjoseph/n-ext";
import { Serializable } from "@nivinjoseph/n-util";

// public
export abstract class DomainObject extends Serializable
{
    /**
     * @param value (the value to compare)
     */
    public equals(value: DomainObject): boolean
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