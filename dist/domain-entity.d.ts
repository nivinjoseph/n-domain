import { DomainObject } from "./domain-object.js";
export declare abstract class DomainEntity<TData extends object = object> extends DomainObject<TData> {
    private readonly _id;
    get id(): string;
    protected constructor(data: Pick<DomainEntity, "id">);
    /**
     * Entities are compared by identity, not state.
     * @param value (the value to compare)
     */
    equals(value: DomainObject | null | undefined): boolean;
}
//# sourceMappingURL=domain-entity.d.ts.map