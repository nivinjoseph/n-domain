import { Schema, Serializable } from "@nivinjoseph/n-util";
/**
 * Base class for value objects — immutable, identity-free domain values compared by state.
 *
 * Subclasses follow a self-referential generic idiom: pass the class itself as `TThis` and the
 * union of its `@serialize` decorated getter names as `TDataKeys`, and type the constructor's
 * parameter as `DomainObjectData<TThis>`. The class itself must also be decorated with
 * `@serialize("YourNamespace")`, or deserialization (and therefore aggregate replay) fails at runtime.
 *
 * @typeParam TThis - the concrete subclass itself
 * @typeParam TDataKeys - union of the subclass's `@serialize` decorated getter names
 *
 * @example
 * ```typescript
 * @serialize("App")
 * class Money extends DomainObject<Money, "amount" | "currency">
 * {
 *     private readonly _amount: number;
 *     private readonly _currency: string;
 *
 *     @serialize
 *     public get amount(): number { return this._amount; }
 *
 *     @serialize
 *     public get currency(): string { return this._currency; }
 *
 *     public constructor(data: DomainObjectData<Money>)
 *     {
 *         super(data);
 *         this._amount = data.amount;
 *         this._currency = data.currency;
 *     }
 * }
 * ```
 */
export declare abstract class DomainObject<TThis extends object, TDataKeys extends keyof TThis> extends Serializable<Schema<TThis, TDataKeys>> {
    private static readonly _serializableKeysCache;
    /**
     * @throws on fresh construction if `data` contains properties that do not correspond to
     * `@serialize` decorated getters. Hydrations of stored artifacts (`data` carrying `$typename`)
     * skip this check, since deprecated fields may linger in storage.
     */
    protected constructor(data: Schema<TThis, TDataKeys>);
    private static _fetchSerializableKeys;
    /**
     * Structural equality: true when `value` has the same type name and identical serialized state.
     * @param value (the value to compare)
     */
    equals(value: DomainObject<object, never> | null | undefined): boolean;
}
/**
 * The serialized data shape of a DomainObject subclass, derived from its `@serialize` decorated
 * getters. Use it to type the subclass constructor's parameter:
 * `constructor(data: DomainObjectData<Money>)`.
 */
export type DomainObjectData<T extends DomainObject<object, never>> = ReturnType<T["serialize"]>;
//# sourceMappingURL=domain-object.d.ts.map