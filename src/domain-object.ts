import "@nivinjoseph/n-ext";

// public
export abstract class DomainObject
{
    /**
     * Please also provide corresponding static deserialize method
     */
    public abstract serialize(): any;
    
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
        
        return JSON.stringify(this) === JSON.stringify(value);
        
        // for (const key in this)
        // {
        //     if (this[key] !== (<any>value)[key])
        //         return false;
        // }
        
        // return true;
    }
}