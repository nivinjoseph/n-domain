import { given } from "@nivinjoseph/n-defensive";
import { Schema, Serializable } from "@nivinjoseph/n-util";

// n-util (imported above) polyfills Symbol.metadata at module load and registers
// @serialize decorated getters under this global registry symbol
const symbolMetadata = (Symbol as { metadata?: symbol; }).metadata!;
const serializableFieldsKey = Symbol.for("@nivinjoseph/n-util/serializable/fields");

// public
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
export abstract class DomainObject<TThis extends object, TDataKeys extends keyof TThis> extends Serializable<Schema<TThis, TDataKeys>>
{
    private static readonly _serializableKeysCache = new Map<object, ReadonlySet<string>>();


    /**
     * @throws on fresh construction if `data` contains properties that do not correspond to
     * `@serialize` decorated getters. Hydrations of stored artifacts (`data` carrying `$typename`)
     * skip this check, since deprecated fields may linger in storage.
     */
    protected constructor(data: Schema<TThis, TDataKeys>)
    {
        super(data);

        // data carrying $typename is a hydration of a stored artifact (Deserializer path);
        // unknown keys there are tolerated since they may be deprecated fields that still
        // linger in storage after being removed from code
        if ("$typename" in data)
            return;

        // fresh constructions from code can never include $typename, and the type system
        // cannot see @serialize decorators, so enforce at runtime that every data property
        // corresponds to a decorated getter
        const allowedKeys = DomainObject._fetchSerializableKeys(this.constructor);
        const invalidKeys = Object.keys(data).filter(key => !allowedKeys.has(key));

        given(invalidKeys, "data")
            .ensure(t => t.length === 0,
                `data for class '${this.constructor.name}' contains properties [${invalidKeys.join(", ")}] that do not correspond to @serialize decorated getters`);
    }


    private static _fetchSerializableKeys(ctor: object): ReadonlySet<string>
    {
        let keys = DomainObject._serializableKeysCache.get(ctor);
        if (keys == null)
        {
            const meta = (ctor as Record<symbol, unknown>)[symbolMetadata] as Record<symbol, unknown> | undefined;
            const fields = (meta?.[serializableFieldsKey] ?? []) as ReadonlyArray<SerializableFieldInfo>;

            const keySet = new Set<string>();
            fields.forEach(field =>
            {
                keySet.add(field.name);
                if (field.key != null)
                    keySet.add(field.key);
            });

            keys = keySet;
            DomainObject._serializableKeysCache.set(ctor, keys);
        }
        return keys;
    }

    /**
     * Structural equality: true when `value` has the same type name and identical serialized state.
     * @param value (the value to compare)
     */
    public equals(value: DomainObject<object, never> | null | undefined): boolean
    {
        if (value == null)
            return false;
        
        if (value === this)
            return true;
        
        if (value.getTypeName() !== this.getTypeName())
            return false;
        
        return JSON.stringify(this.serialize()) === JSON.stringify(value.serialize());
    }
}

// shape of the entries n-util records for each @serialize decorated getter
interface SerializableFieldInfo
{
    name: string;
    key?: string;
}

// public
/**
 * The serialized data shape of a DomainObject subclass, derived from its `@serialize` decorated
 * getters. Use it to type the subclass constructor's parameter:
 * `constructor(data: DomainObjectData<Money>)`.
 */
export type DomainObjectData<T extends DomainObject<object, never>> = ReturnType<T["serialize"]>;