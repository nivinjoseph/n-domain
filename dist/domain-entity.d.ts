import { DomainObject } from "./domain-object";
export declare abstract class DomainEntity<TData extends object = {}> extends DomainObject<TData> {
    private readonly _id;
    get id(): string;
    protected constructor(data: Pick<DomainEntity, "id">);
}
//# sourceMappingURL=domain-entity.d.ts.map