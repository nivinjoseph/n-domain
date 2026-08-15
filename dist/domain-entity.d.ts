import { DomainObject, DomainObjectData } from "./domain-object.js";
/**
 * Base class for entities — domain objects with identity, compared by `id` rather than state
 * (use `deepEquals` for state comparison).
 *
 * Follows the same self-referential generic idiom as {@link DomainObject}: pass the class itself
 * as `TThis` and its `@serialize` decorated getter names as `TDataKeys`. `"id"` is added to the
 * data keys automatically, so subclass constructors always receive an `id: string` in their data.
 *
 * @typeParam TThis - the concrete subclass itself (must have an `id: string`)
 * @typeParam TDataKeys - union of the subclass's `@serialize` decorated getter names, excluding `id`
 */
export declare abstract class DomainEntity<TThis extends {
    id: string;
}, TDataKeys extends keyof TThis> extends DomainObject<TThis, TDataKeys | "id"> {
    private readonly _id;
    get id(): string;
    protected constructor(data: DomainObjectData<DomainEntity<TThis, TDataKeys>>);
    /**
     * Entities are compared by identity, not state.
     * @param value (the value to compare)
     */
    equals(value: DomainObject<object, never> | null | undefined): boolean;
    /**
     * Entities are compared by state, including identity.
     * @param value (the value to compare)
     */
    deepEquals(value: DomainObject<object, never> | null | undefined): boolean;
}
//# sourceMappingURL=domain-entity.d.ts.map