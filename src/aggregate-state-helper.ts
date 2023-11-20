import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Deserializer } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state";
import { DomainObject } from "./domain-object";


export class AggregateStateHelper
{
    public static serializeStateIntoSnapshot(state: object, ...cloneKeys: ReadonlyArray<string>): object
    {
        const snapshot: Record<string, any> = Object.assign({}, state);

        Object.keys(snapshot).forEach(key =>
        {
            const val = snapshot[key];
            if (val && typeof val === "object")
            {
                if (cloneKeys.contains(key))
                {
                    snapshot[key] = JSON.parse(JSON.stringify(val));
                    return;
                }

                if (Array.isArray(val))
                    snapshot[key] = (<Array<Object>>val).map(t =>
                    {
                        if (typeof t === "object")
                            return this._serializeForSnapshot(t);
                        else
                            return t;
                    });
                else
                    snapshot[key] = this._serializeForSnapshot(val);
            }
        });

        return snapshot;
    }

    public static deserializeSnapshotIntoState(snapshot: object): object
    {
        given(snapshot, "snapshot").ensureHasValue().ensureIsObject();

        const deserialized: Record<string, any> = {};

        Object.keys(snapshot).forEach(key =>
        {
            const value = (snapshot as any)[key];
            if (value == null || typeof value !== "object")
            {
                deserialized[key] = value;
                return;
            }

            if (Array.isArray(value))
            {
                deserialized[key] = value.map(v =>
                {
                    if (v == null || typeof v !== "object" || !Deserializer.hasType(v.$typename))
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return v;

                    return Deserializer.deserialize(v);
                });
            }
            else
            {
                deserialized[key] = Deserializer.hasType(value.$typename)
                    ? Deserializer.deserialize(value) : value;
            }
        });

        return deserialized;
    }
    
    public static rebaseState<T extends AggregateState>(state: T, defaultState: object, rebaseState: object, rebaseVersion: number): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();
        given(defaultState, "defaultState").ensureHasValue().ensureIsObject();
        given(rebaseState, "rebaseState").ensureHasValue().ensureIsObject();
        given(rebaseVersion, "rebaseVersion").ensureHasValue().ensureIsNumber().ensure(t => t > 0);

        // current factory generated default state
        // layer rebaseState state on top of it
        // layer the above result on top of current state

        defaultState = AggregateStateHelper.deserializeSnapshotIntoState(defaultState);
        rebaseState = AggregateStateHelper.deserializeSnapshotIntoState(rebaseState);

        // console.dir(state);
        // console.dir(defaultState);
        // console.dir(rebaseState);

        Object.assign(state, defaultState, rebaseState);

        state.isRebased = true;
        state.rebasedFromVersion = rebaseVersion;

        // console.dir(state);
    }

    private static _serializeForSnapshot(value: Object): object
    {
        if (value instanceof DomainObject)
            return value.serialize() as object;

        if (Object.keys(value).some(t => t.startsWith("_")))
            throw new ApplicationException(
                `attempting to serialize an object [${value.getTypeName()}] with private fields but does not extend DomainObject for the purposes of snapshot`);

        return JSON.parse(JSON.stringify(value)) as object;

        // given(value, "value").ensureHasValue().ensureIsObject()
        //     .ensure(t => !!(<any>t).serialize, `serialize method is missing on type ${value.getTypeName()}`)
        //     .ensure(t => typeof ((<any>t).serialize) === "function", `property serialize on type ${value.getTypeName()} is not a function`);

        // return (<any>value).serialize();
    }
}