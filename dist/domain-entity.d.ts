import { DomainObject } from "./domain-object";
export declare abstract class DomainEntity extends DomainObject {
    private readonly _id;
    get id(): string;
    protected constructor(id: string);
}
