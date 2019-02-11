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
    public abstract equals(value: this): boolean;
}