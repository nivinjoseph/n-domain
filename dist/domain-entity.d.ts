import { DomainObject } from "./domain-object";
export declare abstract class DomainEntity extends DomainObject {
    private readonly _id;
    readonly id: string;
    protected constructor(id: string);
}
