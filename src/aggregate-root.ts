import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Deserializer, Serializable, serialize } from "@nivinjoseph/n-util";
import { createHash } from "node:crypto";
import { AggregateRootData } from "./aggregate-root-data.js";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { AggregateState, BASE_STATE_KEYS, clearBaseState } from "./aggregate-state.js";
import { DomainContext } from "./domain-context.js";
import { DomainEventData } from "./domain-event-data.js";
import { DomainEvent } from "./domain-event.js";
import { isRebaseEvent } from "./rebase-event.js";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
import { AggregateFactory } from "./aggregate-factory.js";

// public
export abstract class AggregateRoot<T extends AggregateState, TDomainEvent extends DomainEvent<T>> extends Serializable<AggregateRootData>
{
    private readonly _domainContext: DomainContext;
    private readonly _stateFactory: AggregateStateFactory<T>;
    private readonly _state: T;
    private readonly _retroEvents: ReadonlyArray<DomainEvent<T>>;
    private readonly _retroVersion: number;
    private readonly _currentEvents = new Array<DomainEvent<T>>(); // track unit of work stuff
    private readonly _isNew: boolean = false;
    private _isReconstructed = false;
    private _reconstructedFromVersion = 0;


    protected get state(): T { return this._state; }


    public get context(): DomainContext { return this._domainContext; }

    @serialize("$id")
    public get id(): string { return this._state.id; }

    public get retroEvents(): ReadonlyArray<DomainEvent<T>> { return this._retroEvents.orderBy(t => t.version); }
    public get retroVersion(): number { return this._retroVersion; }

    public get currentEvents(): ReadonlyArray<DomainEvent<T>> { return this._currentEvents.orderBy(t => t.version); }
    public get currentVersion(): number { return this._state.version; }

    @serialize("$events")
    public get events(): ReadonlyArray<DomainEvent<T>> { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }

    @serialize("$version")
    public get version(): number { return this.currentVersion; }

    @serialize("$createdAt")
    public get createdAt(): number { return this._state.createdAt; }

    @serialize("$updatedAt")
    public get updatedAt(): number { return this._state.updatedAt; }

    public get isNew(): boolean { return this._isNew; } // this will always be false for anything that is reconstructed
    public get hasChanges(): boolean { return this.currentVersion !== this.retroVersion; }

    public get isReconstructed(): boolean { return this._isReconstructed; }
    public get reconstructedFromVersion(): number { return this._reconstructedFromVersion; }

    public get isRebased(): boolean { return this._state.isRebased; }
    public get rebasedFromVersion(): number { return this._state.rebasedFromVersion; }


    public constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>,
        stateFactory: AggregateStateFactory<T>, currentState?: T)
    {
        super({} as any);

        given(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        this._domainContext = domainContext;

        given(events, "events").ensureHasValue().ensureIsArray();
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        this._stateFactory = stateFactory;

        given(currentState as object, "currentState").ensureIsObject();
        this._state = Object.assign(this._stateFactory.create(), currentState);

        if (this._state.version)
        {
            given(events, "events")
                .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
            this._retroEvents = [];
        }
        else
        {
            given(events, "events")
                .ensure(t => t.length > 0, "no events passed")
                .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
            this._retroEvents = [...events];
            const unappliedCount = this._retroEvents.count(t => (<any>t)._aggregateId == null); // Deliberate workaround to access aggregateId
            given(events, "events").ensure(
                _ => unappliedCount === 0 || unappliedCount === this._retroEvents.length,
                "events must be all stored (deserialized) or all new; mixed streams are not supported");
            if (unappliedCount > 0)
                this._isNew = true;
            if (this._isNew)
            {
                // freeze the pristine default state (current create() output, captured here before any event
                // mutates this._state) into the created event, with base fields stripped and the current
                // schema version stamped as $schemaVersion metadata. on every future replay this is upcast
                // and overlaid as the base layer so fields no event writes are sourced from the stream
                // rather than from a (possibly changed) future create().
                const frozenDefaultState = AggregateStateHelper.serializeStateIntoSnapshot(this._state);
                clearBaseState(frozenDefaultState);
                (frozenDefaultState as Record<string, any>)["$schemaVersion"] = this._stateFactory.schemaVersion;
                const createdEvent = this._retroEvents.find(t => t.isCreatedEvent)!;
                // stamp the frozen defaults onto the created event's internal field via cast (same workaround as
                // _aggregateId above), keeping this framework detail off DomainEvent's public surface.
                given(createdEvent, "createdEvent")
                    .ensure(t => (<any>t)._frozenDefaultState == null, "created event already has frozen default state");
                (<any>createdEvent)._frozenDefaultState = frozenDefaultState;

                // brand-new events get the write-time schema version stamp (legacy stored events are never retro-stamped)
                this._retroEvents.forEach(t =>
                {
                    if ((<any>t)._schemaVersion == null)
                        (<any>t)._schemaVersion = this._stateFactory.schemaVersion;
                });

                this._retroEvents.forEach(t => this._applyEventToState(t));
            }
            else
            {
                this._retroEvents.orderBy(t => t.version).forEach(t => this._applyEventToState(t));

                // end-of-replay conformance guard: every sanctioned ingress upcasts to the current
                // shape, so extra keys here mean the stream carries old-shape residue that bypassed
                // the migration chain — in practice a pre-4.0 rebase event whose payload predates
                // the chain. failing loudly now beats silently-stale reads and a snapshot() failure later.
                const extraKeys = this._findNonConformingKeys();
                if (extraKeys.length > 0)
                    throw new ApplicationException(
                        `replayed state of '${(<Object>this).getTypeName()}' has keys [${extraKeys.join(", ")}] that do not exist `
                        + `on the current state shape; the stream likely contains a pre-4.0 rebase event written before the `
                        + `migration chain existed — re-rebase this stream (loading it under the pre-migration factory) `
                        + `before shipping migration steps`);
            }
        }

        this._retroVersion = this.currentVersion;
    }

    public static deserializeFromEvents<TAggregate extends AggregateRoot<TAggregateState, TAggregateDomainEvent>,
        TAggregateState extends AggregateState, TAggregateDomainEvent extends DomainEvent<TAggregateState>>(domainContext: DomainContext,
            aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, eventData: ReadonlyArray<DomainEventData>): TAggregate
    {
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        given(eventData, "eventData").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);


        // given(data, "data").ensureHasValue().ensureIsObject()
        //     .ensureHasStructure({
        //         $id: "string",
        //         $version: "number",
        //         $createdAt: "number",
        //         $updatedAt: "number",
        //         $events: [{
        //             $aggregateId: "string",
        //             $id: "string",
        //             $userId: "string",
        //             $name: "string",
        //             $occurredAt: "number",
        //             $version: "number",
        //             $isCreatedEvent: "boolean"
        //         }]
        //     });

        const deserializedEvents = eventData.map((eventData) =>
        {
            return Deserializer.deserialize<DomainEvent<any>>(eventData);

            // const name = eventData.$name;
            // const event = eventTypes.find(t => (<Object>t).getTypeName() === name);
            // if (!event)
            //     throw new ApplicationException(`No event type supplied for event with name '${name}'`);
            // if (!(<any>event).deserializeEvent)
            //     throw new ApplicationException(`Event type '${name}' does not have a static deserializeEvent method defined.`);
            // return (<any>event).deserializeEvent(eventData);
        });

        
        // return new aggregateType(domainContext, deserializedEvents);
        
        return new AggregateFactory(aggregateType, domainContext, stateFactory)
            .createFromEvents(deserializedEvents);
    }

    // public serialize(): AggregateRootData
    // {
    //     return {
    //         $id: this.id,
    //         $version: this.version,
    //         $createdAt: this.createdAt,
    //         $updatedAt: this.updatedAt,
    //         $events: this.events.map(t => t.serialize())
    //     };
    // }

    // public serialize(): AggregateRootData
    // {
    //     return super.serialize() as AggregateRootData;
    // }

    public static deserializeFromSnapshot<TAggregate extends AggregateRoot<TAggregateState, TAggregateDomainEvent>,
        TAggregateState extends AggregateState, TAggregateDomainEvent extends DomainEvent<TAggregateState>>(domainContext: DomainContext,
            aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>,
            stateSnapshot: TAggregateState): TAggregate
    {
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        given(stateSnapshot, "stateSnapshot").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                id: "string",
                version: "number",
                createdAt: "number",
                updatedAt: "number"
            });

        const deserializedSnapshot = stateFactory.ingestSnapshot(stateSnapshot);

        return new aggregateType(domainContext, [], stateFactory, deserializedSnapshot);
    }

    public snapshot(...cloneKeys: ReadonlyArray<string>): T | object
    {
        // egress conformance guard: a state carrying keys that do not exist on the current create()
        // output can never be photographed into a snapshot — this severs the loop where residue
        // from old-shape artifacts would otherwise be laundered under the current schema version.
        const extraKeys = this._findNonConformingKeys();
        if (extraKeys.length > 0)
            throw new ApplicationException(
                `state of '${(<Object>this).getTypeName()}' has keys [${extraKeys.join(", ")}] that do not exist `
                + `on the current state shape; refusing to snapshot nonconforming state`);

        const snapshot = AggregateStateHelper.serializeStateIntoSnapshot(this.state, ...cloneKeys) as Record<string, any>;
        snapshot["$schemaVersion"] = this._stateFactory.schemaVersion;
        return snapshot;
    }

    public constructVersion(version: number): this
    {
        given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        // const ctor = (<Object>this).constructor;
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // const result = new (<any>ctor)(this._domainContext, this.events.filter(t => t.version <= version)) as this;
        const result = new AggregateFactory((<Object>this).constructor as any, this._domainContext, this._stateFactory)
            .createFromEvents(this.events.filter(t => t.version <= version));
        result._isReconstructed = true;
        result._reconstructedFromVersion = this.version;
        return result as this;
    }

    public constructBefore(dateTime: number): this
    {
        given(dateTime, "dateTime").ensureHasValue().ensureIsNumber()
            .ensure(t => t > this.createdAt, "dateTime must be after createdAt");

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        // const ctor = (<Object>this).constructor;
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // const result = new (<any>ctor)(this._domainContext, this.events.filter(t => t.occurredAt < dateTime)) as this;
        const result = new AggregateFactory((<Object>this).constructor as any, this._domainContext, this._stateFactory)
            .createFromEvents(this.events.filter(t => t.occurredAt < dateTime));
        result._isReconstructed = true;
        result._reconstructedFromVersion = this.version;
        return result as this;
    }

    public hasEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }

    public hasRetroEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._retroEvents.some(t => t.name === eventTypeName);
    }

    public hasCurrentEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._currentEvents.some(t => t.name === eventTypeName);
    }

    public getEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType> 
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this.events.filter(t => t.name === eventTypeName) as Array<TEventType>;
    }

    public getRetroEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType> 
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._retroEvents.filter(t => t.name === eventTypeName) as Array<TEventType>;
    }

    public getCurrentEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType> 
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._currentEvents.filter(t => t.name === eventTypeName) as Array<TEventType>;
    }

    /**
     * 
     * @param createdEvent - provide a new created event to be used by the clone
     * @param serializedEventMutatorAndFilter - provide a function that can mutate the serialized event if required and returns a boolean indicating whether to include the event or not.
     * @returns - cloned Aggregate
     */
    public clone(createdEvent: DomainEvent<T>,
        serializedEventMutatorAndFilter?: (event: { $name: string; }) => boolean): this
    {
        given(createdEvent, "createdEvent").ensureHasValue().ensureIsInstanceOf(DomainEvent)
            .ensure(t => t.isCreatedEvent, "must be created event");

        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        given(serializedEventMutatorAndFilter as Function, "serializedEventMutator").ensureIsFunction();

        given(this, "this").ensure(t => t.retroEvents.length > 0, "invoking method on object without retro events");

        // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        // const clone: this = new (<any>this.constructor)(domainContext, [createdEvent]);
        const clone = new AggregateFactory((<Object>this).constructor as any, this._domainContext, this._stateFactory)
            .createFromEvents([createdEvent]);
        

        this.events
            .where(t => !t.isCreatedEvent)
            .forEach(t =>
            {
                const serializedEvent = t.serialize();

                if (serializedEventMutatorAndFilter != null)
                {
                    const keep = serializedEventMutatorAndFilter(serializedEvent as any);
                    if (!keep)
                        return;
                }

                serializedEvent.$aggregateId = null;
                serializedEvent.$id = null;
                serializedEvent.$userId = null;
                // serializedEvent.$name = null; // we keep the name intact
                serializedEvent.$occurredAt = null;
                serializedEvent.$version = null;
                // serializedEvent.$isCreatedEvent = null; // we dont need to touch this

                clone.applyEvent(Deserializer.deserialize(serializedEvent));
            });

        return clone as this;
    }

    public test(): void
    {
        const type = (<Object>this).constructor as new (...params: Array<any>) => this;
        given(type, "type").ensureHasValue().ensureIsFunction()
            .ensure(t => (<Object>t).getTypeName() === (<Object>this).getTypeName(), "type name mismatch");


        const defaultState = this._stateFactory.create();
        given(defaultState, "defaultState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this._stateFactory.create()), "multiple default state creations are not consistent");


        // // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        // const deserializeEvents: Function = (<any>type).deserializeEvents;
        // given(deserializeEvents, "deserializeEvents").ensureHasValue().ensureIsFunction();

        const eventsSerialized = this.serialize();
        given(eventsSerialized, "eventsSerialized").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                $id: "string",
                $version: "number",
                $createdAt: "number",
                $updatedAt: "number",
                $events: ["object"]
            })
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.serialize()), "multiple serializations are not consistent");

        const eventsDeserializedAggregate: this = AggregateRoot.deserializeFromEvents(this._domainContext, type, this._stateFactory, eventsSerialized.$events);
        given(eventsDeserializedAggregate, "eventsDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);

        const eventsDeserializedAggregateState = eventsDeserializedAggregate.state;
        console.log("eventsDeserializedAggregateState", JSON.stringify(eventsDeserializedAggregateState));
        console.log("state", JSON.stringify(this.state));

        const eventsDeserializedAggregateStateHash = createHash("sha512")
            .update(JSON.stringify(eventsDeserializedAggregateState).trim())
            .digest("hex").toUpperCase();

        const originalStateHash = createHash("sha512")
            .update(JSON.stringify(this.state).trim())
            .digest("hex").toUpperCase();

        given(eventsDeserializedAggregateStateHash, "eventsDeserializedAggregateStateHash").ensureHasValue().ensureIsString()
            .ensure(t => t === originalStateHash, "state is not consistent with original state");

        // // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        // const deserializeSnapshot: Function = (<any>type).deserializeSnapshot;
        // given(deserializeSnapshot, "deserializeSnapshot").ensureHasValue().ensureIsFunction();

        const snapshot = this.snapshot();
        given(snapshot, "snapshot").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.snapshot()), "multiple snapshots are not consistent");

        const snapshotDeserializedAggregate: this = AggregateRoot.deserializeFromSnapshot(this._domainContext, type, this._stateFactory, snapshot as AggregateState);
        given(snapshotDeserializedAggregate, "snapshotDeserializedAggregate").ensureHasValue().ensureIsObject().ensureIsType(type);

        const snapshotDeserializedAggregateState = snapshotDeserializedAggregate.state;
        given(snapshotDeserializedAggregateState, "snapshotDeserializedAggregateState").ensureHasValue().ensureIsObject()
            .ensure(t => JSON.stringify(t) === JSON.stringify(this.state), "state is not consistent with original state");
    }

    protected rebase(version: number, rebasedEventFactoryFunc: (baseline: object, rebaseVersion: number) => TDomainEvent): void
    {
        given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);

        given(rebasedEventFactoryFunc, "rebasedEventFactoryFunc").ensureHasValue().ensureIsFunction();

        const rebaseVersionInstance = this.constructVersion(version);
        given(rebaseVersionInstance, "rebaseVersionInstance")
            .ensure(t => t.version === version, "could not reconstruct rebase version");
        const rebaseVersion = rebaseVersionInstance.version;
        // the baseline is the COMPLETE state at the rebase version (base fields stripped), so it is
        // current-shape by construction and stamped with the schema version that shaped it.
        const baseline = AggregateStateHelper.serializeStateIntoSnapshot(rebaseVersionInstance.state);
        clearBaseState(baseline);
        (baseline as Record<string, any>)["$schemaVersion"] = this._stateFactory.schemaVersion;

        const rebaseEvent = rebasedEventFactoryFunc(baseline, rebaseVersion);
        given(rebaseEvent as object, "rebaseEvent").ensureHasValue().ensureIsObject()
            .ensure(t => isRebaseEvent(t), "rebase event must extend RebaseEvent (or OrgRebaseEvent for org aggregates)");

        this.applyEvent(rebaseEvent);
    }

    protected applyEvent(event: TDomainEvent): void
    {
        given(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(DomainEvent)
            .ensure(t => t.isCreatedEvent ? this._retroEvents.isEmpty && this._currentEvents.isEmpty : true,
                "'isCreatedEvent = true' cannot be the case for multiple events");

        // stamp the write-time schema version onto new events (never retro-stamp legacy stored events)
        if ((<any>event)._schemaVersion == null)
            (<any>event)._schemaVersion = this._stateFactory.schemaVersion;

        this._applyEventToState(event);

        this._currentEvents.push(event);

        // if (this._retroEvents.length > 0)
        // {
        //     const trimmed = this.trim(this._retroEvents.orderBy(t => t.version)).orderBy(t => t.version);
        //     given(trimmed, "trimmed").ensureHasValue().ensureIsArray()
        //         .ensure(t => t.length > 0, "cannot trim all retro events")
        //         .ensure(t => t.length <= this._retroEvents.length, "only contraction is allowed")
        //         .ensure(t => t.some(u => u.isCreatedEvent), "cannot trim created event")
        //         .ensure(t => t.count(u => u.isCreatedEvent) === 1, "cannot add new created events")
        //         .ensure(t => t.every(u => this._retroEvents.contains(u)), "cannot add new events")
        //         ;

        //     this._retroEvents = trimmed;
        // }
    }

    /**
     * The single seam through which every event (retro replay and new application) reaches the
     * state. It owns the two stored-state-artifact overlays — both upcast their payload through
     * the factory's migration chain at ingress, BEFORE the data merges into live state:
     * - created events carrying frozen default state overlay the historical create() defaults
     *   onto the current-code base before the event's own applyEvent sets real values, isolating
     *   replay from future create() default changes for fields no event writes;
     * - framework-owned rebase events RESET the state to their baseline: every domain key is
     *   cleared (so no residue from earlier overlays or old shapes survives), current create()
     *   defaults fill fields added after the rebase was written, and the upcasted baseline lays
     *   down the authoritative values.
     */
    private _applyEventToState(event: DomainEvent<T>): void
    {
        // deliberate framework access to the event's internal field via cast (same idiom as _aggregateId)
        const frozenDefaultState = (<any>event)._frozenDefaultState as object | null;
        if (event.isCreatedEvent && frozenDefaultState != null)
        {
            const upcasted = this._upcastArtifact(frozenDefaultState, "frozen-default");
            Object.assign(this._state, AggregateStateHelper.deserializeSnapshotIntoState(upcasted));
        }

        if (isRebaseEvent(event))
        {
            const upcasted = this._upcastArtifact(event.baseline, "rebase-baseline");

            Object.keys(this._state)
                .where(t => !BASE_STATE_KEYS.contains(t))
                .forEach(key =>
                {
                    delete (this._state as Record<string, unknown>)[key];
                });

            const domainDefaults = this._stateFactory.create() as Record<string, any>;
            clearBaseState(domainDefaults);
            Object.assign(this._state, domainDefaults);

            Object.assign(this._state, AggregateStateHelper.deserializeSnapshotIntoState(upcasted));

            this._state.isRebased = true;
            this._state.rebasedFromVersion = event.rebaseVersion;
        }

        event.apply(this, this._domainContext, this._state);
    }

    private _upcastArtifact(artifact: object, kind: "frozen-default" | "rebase-baseline"): Record<string, any>
    {
        const payload = Object.assign({}, artifact) as Record<string, any>;
        // artifacts persisted before schema versioning existed carry no stamp; the factory's
        // preVersioningSchemaVersion (default 1) declares which chain position they were written at.
        const declaredVersion = (payload["$schemaVersion"] ?? this._stateFactory.preVersioningSchemaVersion) as number;
        delete payload["$schemaVersion"];
        return this._stateFactory.upcastStateDocument(payload, declaredVersion, kind);
    }

    // keys on live state that exist neither in BASE_STATE_KEYS nor on the current create() output —
    // i.e. old-shape residue that no sanctioned (upcasting) ingress could have produced.
    private _findNonConformingKeys(): Array<string>
    {
        const domainKeys = Object.keys(this._stateFactory.create());
        return Object.keys(this._state)
            .where(t => !BASE_STATE_KEYS.contains(t) && !domainKeys.contains(t));
    }

    // /**
    //  *
    //  * @deprecated DO NOT USE
    //  * @description override to trim retro events on the application of a new event
    //  */
    // protected trim(retroEvents: ReadonlyArray<DomainEvent<T>>): ReadonlyArray<DomainEvent<T>>
    // {
    //     given(retroEvents, "retroEvents").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);

    //     return retroEvents;
    // }
}