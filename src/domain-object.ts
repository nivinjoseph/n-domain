import { given } from "@nivinjoseph/n-defensive";
import { Schema, Serializable } from "@nivinjoseph/n-util";

// n-util (imported above) polyfills Symbol.metadata at module load and registers
// @serialize decorated getters under this global registry symbol
const symbolMetadata = (Symbol as { metadata?: symbol; }).metadata!;
const serializableFieldsKey = Symbol.for("@nivinjoseph/n-util/serializable/fields");

// public
/**
 * Maps a data property's type to its serialized (wire/storage) shape, mirroring exactly what
 * n-util's serialization does at runtime: a domain object becomes its own serialized shape, an
 * array is handled element-wise (one level — elements may be domain objects), and anything else
 * is JSON-cloned (`Date` → ISO string).
 *
 * Shapes the runtime cannot faithfully serialize surface as `never`, turning silent data
 * mangling into a compile error: `Map`/`Set`/`Promise` (JSON-clone to `{}`), and domain objects
 * buried beyond the runtime's reach — inside nested arrays (`Array<Array<DomainObject>>`) or
 * inside plain-object properties — which get JSON-cloned into unrevivable private-field data.
 */
export type SerializedValue<V> =
    V extends null | undefined ? null :
    V extends DomainObject<object, never> ? ReturnType<V["serialize"]> :
    V extends Date ? string :
    V extends Map<unknown, unknown> | Set<unknown> | Promise<unknown> ? never :
    V extends ReadonlyArray<infer E> ? Array<SerializedArrayElement<E>> :
    V extends object ? JsonClonedValue<V> :
    V;

/**
 * One array level below a data property: elements that are domain objects still serialize
 * properly; anything nested deeper (including further arrays) is JSON-cloned by the runtime.
 */
type SerializedArrayElement<E> =
    E extends null | undefined ? null :
    E extends DomainObject<object, never> ? ReturnType<E["serialize"]> :
    E extends Date ? string :
    E extends Map<unknown, unknown> | Set<unknown> | Promise<unknown> ? never :
    E extends ReadonlyArray<infer E2> ? Array<JsonClonedValue<E2>> :
    E extends object ? JsonClonedValue<E> :
    E;

/**
 * JSON-clone territory: the runtime does `JSON.parse(JSON.stringify(value))` here, so domain
 * objects would be mangled into unrevivable private-field data — surfaced as `never`.
 */
type JsonClonedValue<V> =
    V extends null | undefined ? null :
    V extends DomainObject<object, never> ? never :
    V extends Date ? string :
    V extends Map<unknown, unknown> | Set<unknown> | Promise<unknown> ? never :
    V extends ReadonlyArray<infer E> ? Array<JsonClonedValue<E>> :
    V extends object ? { -readonly [K in keyof V]: JsonClonedValue<V[K]>; } :
    V;

// input-side legality — mirrors the three output tiers above; `true` means the runtime can
// faithfully serialize a value of this shape from this position
type LegalDataValue<V> =
    V extends null | undefined ? true :
    V extends DomainObject<object, never> ? true :
    V extends Date ? true :
    V extends Map<unknown, unknown> | Set<unknown> | Promise<unknown> | ((...args: Array<any>) => unknown) ? false :
    V extends ReadonlyArray<infer E> ? LegalArrayElement<E> :
    V extends object ? LegalJsonClonedValue<V> :
    true;

type LegalArrayElement<E> =
    E extends null | undefined ? true :
    E extends DomainObject<object, never> ? true :
    E extends Date ? true :
    E extends Map<unknown, unknown> | Set<unknown> | Promise<unknown> | ((...args: Array<any>) => unknown) ? false :
    E extends ReadonlyArray<infer E2> ? LegalJsonClonedValue<E2> :
    E extends object ? LegalJsonClonedValue<E> :
    true;

type LegalJsonClonedValue<V> =
    V extends null | undefined ? true :
    V extends DomainObject<object, never> ? false :
    V extends Date ? true :
    V extends Map<unknown, unknown> | Set<unknown> | Promise<unknown> | ((...args: Array<any>) => unknown) ? false :
    V extends ReadonlyArray<infer E> ? LegalJsonClonedValue<E> :
    V extends object ? (Exclude<{ [K in keyof V]: LegalJsonClonedValue<V[K]>; }[keyof V], true> extends never ? true : false) :
    true;

/**
 * Data keys whose shapes the runtime cannot faithfully serialize become required `never`
 * properties, making a violating class unconstructible — the convention "a domain object is
 * held directly or in a single-level array" is enforced at construction time.
 */
type IllegalDataKeys<TThis extends object, TDataKeys extends keyof TThis> =
    { [P in TDataKeys as LegalDataValue<TThis[P]> extends true ? never : P]: never; };

// public
/**
 * The constructor-input shape of a DomainObject: the `@serialize`d getter types as-is
 * (nested domain objects are live instances), with unserializable keys poisoned to `never`.
 */
export type DomainObjectDataShape<TThis extends object, TDataKeys extends keyof TThis> =
    Schema<TThis, TDataKeys> & IllegalDataKeys<TThis, TDataKeys>;

// public
/**
 * The serialized (wire/storage) shape of a DomainObject: its data keys mapped through
 * {@link SerializedValue} — so nested domain objects appear as plain serialized data,
 * not instances — plus the `$typename` discriminator stamped at every level.
 * This is what `serialize()` returns.
 */
export type DomainObjectSerialized<TThis extends object, TDataKeys extends keyof TThis> =
    { [P in TDataKeys]: SerializedValue<TThis[P]>; } & { $typename: string; };

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
export abstract class DomainObject<TThis extends object, TDataKeys extends keyof TThis> extends Serializable<DomainObjectSerialized<TThis, TDataKeys>>
{
    private static readonly _serializableKeysCache = new Map<object, ReadonlySet<string>>();

    /**
     * Type-only brand carrying the constructor-input data shape ({@link DomainObjectDataShape},
     * where nested domain objects are live instances). Never assigned at runtime — it exists
     * so {@link DomainObjectData} can recover the input shape now that `serialize()` returns
     * the serialized shape instead. Do not read or list it in `TDataKeys`.
     */
    public declare readonly $data?: DomainObjectDataShape<TThis, TDataKeys>;


    /**
     * @throws on fresh construction if `data` contains properties that do not correspond to
     * `@serialize` decorated getters. Hydrations of stored artifacts (`data` carrying `$typename`)
     * skip this check, since deprecated fields may linger in storage.
     */
    protected constructor(data: DomainObjectDataShape<TThis, TDataKeys>)
    {
        // the input shape (instances) and the serialized shape (plain data) intentionally differ;
        // the base class only sees the latter, so this is the one place the two meet
        super(data as unknown as DomainObjectSerialized<TThis, TDataKeys>);

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
 * The constructor-input data shape of a DomainObject subclass: its `@serialize` decorated getter
 * types as-is, so nested domain objects are live instances. Use it to type the subclass
 * constructor's parameter: `constructor(data: DomainObjectData<Money>)`.
 *
 * Distinct from the serialized output shape — `serialize()` returns
 * {@link DomainObjectSerialized}, where nested domain objects are plain serialized data.
 */
export type DomainObjectData<T extends DomainObject<object, never>> = NonNullable<T["$data"]>;