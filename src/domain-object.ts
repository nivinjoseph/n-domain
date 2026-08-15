import { given } from "@nivinjoseph/n-defensive";
import { Schema, Serializable } from "@nivinjoseph/n-util";

// n-util (imported above) polyfills Symbol.metadata at module load and registers
// @serialize decorated getters under this global registry symbol
const symbolMetadata = (Symbol as { metadata?: symbol; }).metadata!;
const serializableFieldsKey = Symbol.for("@nivinjoseph/n-util/serializable/fields");

// public
export abstract class DomainObject<TThis extends object, TDataKeys extends keyof TThis> extends Serializable<Schema<TThis, TDataKeys>>
{
    private static readonly _serializableKeysCache = new Map<object, ReadonlySet<string>>();


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
export type DomainObjectData<T extends DomainObject<object, never>> = ReturnType<T["serialize"]>;