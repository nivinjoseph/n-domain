import "@nivinjoseph/n-ext";
export declare abstract class DomainObject {
    abstract serialize(): any;
    equals(value: DomainObject): boolean;
}
