import "@nivinjoseph/n-ext";
export declare abstract class DomainObject {
    /**
     * Please also provide corresponding static deserialize method
     */
    abstract serialize(): any;
    /**
     * @param value (the value to compare)
     */
    equals(value: DomainObject): boolean;
}
