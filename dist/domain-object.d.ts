export declare abstract class DomainObject {
    abstract serialize(): any;
    abstract equals(value: this): boolean;
}
