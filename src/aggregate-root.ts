import { DomainEvent } from "./domain-event";
import { AggregateState } from "./aggregate-state";
import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { AggregateRootData } from "./aggregate-root-data";
import "@nivinjoseph/n-ext";
import { DomainContext } from "./domain-context";
import { DomainEventData } from "./domain-event-data";

// public
export abstract class AggregateRoot<T extends AggregateState>
{
    private readonly _domainContext: DomainContext;
    private readonly _state: T;
    private _retroEvents: ReadonlyArray<DomainEvent<T>>;
    private readonly _retroVersion: number;
    private readonly _currentEvents = new Array<DomainEvent<T>>(); // track unit of work stuff
    private readonly _isNew: boolean = false;


    public get id(): string { return this._state.id; }
    
    public get retroEvents(): ReadonlyArray<DomainEvent<T>> { return this._retroEvents.orderBy(t => t.version); }
    public get retroVersion(): number { return this._retroVersion; } 
    
    public get currentEvents(): ReadonlyArray<DomainEvent<T>> { return this._currentEvents.orderBy(t => t.version); }
    public get currentVersion(): number { return this._state.version; }
    
    public get events(): ReadonlyArray<DomainEvent<T>> { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }
    public get version(): number { return this.currentVersion; }
    
    public get createdAt(): number { return this._state.createdAt; }
    public get updatedAt(): number { return this._state.updatedAt; }

    public get isNew(): boolean { return this._isNew; } // this will always be false for anything that is reconstructed
    public get hasChanges(): boolean { return this.currentVersion !== this.retroVersion; }

    protected get context(): DomainContext { return this._domainContext; }
    protected get state(): T { return this._state; }


    public constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>, initialState?: T | object)
    {
        given(domainContext, "domainContext").ensureHasValue()
            .ensureHasStructure({ userId: "string" });
        this._domainContext = domainContext;
        
        given(initialState, "initialState").ensureIsObject();
        this._state = initialState || {} as any;
        
        if (this._state.version)
        {
            given(events, "events").ensureHasValue().ensureIsArray()
                .ensure(t => t.length === 0, "no events should be passed when constructing from snapshot");
            this._retroEvents = [];
        }
        else
        {
            given(events, "events").ensureHasValue().ensureIsArray()
                .ensure(t => t.length > 0, "no events passed")
                .ensure(t => t.some(u => u.isCreatedEvent), "no created event passed")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "more than one created event passed");
            this._retroEvents = events;
            if (this._retroEvents.some(t => t.aggregateId == null))
                this._isNew = true;
            this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this, this._domainContext, this._state));
        }
        
        this._retroVersion = this.currentVersion;
    }

    public static deserializeFromEvents(domainContext: DomainContext, aggregateType: Function, eventTypes: ReadonlyArray<Function>, eventData: ReadonlyArray<DomainEventData>): AggregateRoot<AggregateState>
    {
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        given(eventTypes, "eventTypes").ensureHasValue().ensureIsArray()
            .ensure(t => t.length > 0, "no eventTypes provided")
            .ensure(t => t.map(u => (<Object>u).getTypeName()).distinct().length === t.length, "duplicate event types detected");
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
            const name = eventData.$name;
            const event = eventTypes.find(t => (<Object>t).getTypeName() === name);
            if (!event)
                throw new ApplicationException(`No event type supplied for event with name '${name}'`);
            if (!(<any>event).deserializeEvent)
                throw new ApplicationException(`Event type '${name}' does not have a static deserializeEvent method defined.`);
            return (<any>event).deserializeEvent(eventData);
        });
        
        return new (<any>aggregateType)(domainContext, deserializedEvents);
    }
    
    
    public static deserializeFromSnapshot(domainContext: DomainContext, aggregateType: Function, stateSnapshot: AggregateState | object): AggregateRoot<AggregateState>
    {
        given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        
        given(stateSnapshot, "stateSnapshot").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                id: "string",
                version: "number",
                createdAt: "number",
                updatedAt: "number"
            });
        
        return new (<any>aggregateType)(domainContext, [], stateSnapshot);
    }


    public serialize(): AggregateRootData
    {
        return {
            $id: this.id,
            $version: this.version,
            $createdAt: this.createdAt,
            $updatedAt: this.updatedAt,
            $events: this.events.map(t => t.serialize())
        };
    }
    
    public snapshot(...cloneKeys: string[]): T | object
    {
        const snapshot: any = Object.assign({}, this.state);
        
        Object.keys(snapshot).forEach(key =>
        {
            const val = snapshot[key];
            if (val && typeof (val) === "object")
            {
                if (cloneKeys.contains(key))
                {
                    snapshot[key] = JSON.parse(JSON.stringify(val));
                    return;
                }
                
                if (Array.isArray(val))
                    snapshot[key] = (<Array<Object>>val).map(t =>
                    {
                        if (typeof (t) === "object")
                            return this.serializeForSnapshot(t);
                        else
                            return t;
                    });
                else
                    snapshot[key] = this.serializeForSnapshot(val);
            }
        });
        
        return snapshot;
    }

    public constructVersion(version: number): this
    {
        given(version, "version").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0 && t <= this.version, `version must be > 0 and <= ${this.version} (current version)`);
        
        given(this, "this").ensure(t => t.retroEvents.length > 0, "constructing version without retro events");

        const ctor = (<Object>this).constructor;
        return new (<any>ctor)(this._domainContext, this.events.filter(t => t.version <= version));
    }

    public hasEventOfType(eventType: Function): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this.events.some(t => t.name === eventTypeName);
    }

    public hasRetroEventOfType(eventType: Function): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._retroEvents.some(t => t.name === eventTypeName);
    }

    public hasCurrentEventOfType(eventType: Function): boolean
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._currentEvents.some(t => t.name === eventTypeName);
    }

    public getEventsOfType<TEventType extends DomainEvent<T>>(eventType: Function): ReadonlyArray<TEventType> 
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this.events.filter(t => t.name === eventTypeName) as any;
    }

    public getRetroEventsOfType<TEventType extends DomainEvent<T>>(eventType: Function): ReadonlyArray<TEventType> 
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._retroEvents.filter(t => t.name === eventTypeName) as any;
    }

    public getCurrentEventsOfType<TEventType extends DomainEvent<T>>(eventType: Function): ReadonlyArray<TEventType> 
    {
        given(eventType, "eventType").ensureHasValue().ensureIsFunction();

        const eventTypeName = (<Object>eventType).getTypeName();
        return this._currentEvents.filter(t => t.name === eventTypeName) as any;
    }
    

    protected applyEvent(event: DomainEvent<AggregateState>): void
    {
        event.apply(this, this._domainContext, this._state);

        this._currentEvents.push(event);
 
        if (this._retroEvents.length > 0)
        {
            const trimmed = this.trim(this._retroEvents.orderBy(t => t.version)).orderBy(t => t.version);
            given(trimmed, "trimmed").ensureHasValue().ensureIsArray()
                .ensure(t => t.length > 0, "cannot trim all retro events")
                .ensure(t => t.length <= this._retroEvents.length, "only contraction is allowed")
                .ensure(t => t.some(u => u.isCreatedEvent), "cannot trim created event")
                .ensure(t => t.count(u => u.isCreatedEvent) === 1, "cannot add new created events")
                .ensure(t => t.every(u => this._retroEvents.contains(u)), "cannot add new events")
                ;

            this._retroEvents = trimmed;
        }
    }
    // override
    protected trim(retroEvents: ReadonlyArray<DomainEvent<T>>): ReadonlyArray<DomainEvent<T>>
    {
        given(retroEvents, "retroEvents").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
        
        return retroEvents;
    }
    
    
    private serializeForSnapshot(value: Object): object
    {
        given(value, "value").ensureHasValue().ensureIsObject()
            .ensure(t => t.hasOwnProperty("serialize"), `serialize method is missing on type ${value.getTypeName()}`)
            .ensure(t => typeof ((<any>t).serialize) === "function", `property serialize on type ${value.getTypeName()} is not a function`);

        return (<any>value).serialize();
    }
}