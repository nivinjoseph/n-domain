import { DomainEvent } from "./domain-event";
import { AggregateState } from "./aggregate-state";
import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { AggregateRootData } from "./aggregate-root-data";
import "@nivinjoseph/n-ext";

// public
export abstract class AggregateRoot<T extends AggregateState>
{
    private readonly _state: T;
    private readonly _retroEvents: ReadonlyArray<DomainEvent<T>>;
    private readonly _retroVersion: number;
    private readonly _currentEvents = new Array<DomainEvent<T>>(); // track unit of work stuff


    public get id(): string { return this._state.id; }
    
    public get retroEvents(): ReadonlyArray<DomainEvent<T>> { return this._retroEvents.orderBy(t => t.version); }
    public get retroVersion(): number { return this._retroVersion; } 
    
    public get currentEvents(): ReadonlyArray<DomainEvent<T>> { return this._currentEvents.orderBy(t => t.version); }
    public get currentVersion(): number { return this._state.version; }
    
    public get events(): ReadonlyArray<DomainEvent<T>> { return [...this._retroEvents, ...this._currentEvents].orderBy(t => t.version); }
    public get version(): number { return this.currentVersion; }

    public abstract get createdAt(): number;
    public get updatedAt(): number { return this.events.orderByDesc(t => t.version)[0].occurredAt; }

    public get hasChanges(): boolean { return this.currentVersion !== this.retroVersion; }


    protected get state(): T { return this._state; }


    public constructor(events: ReadonlyArray<DomainEvent<AggregateState>>, initialState?: T | object)
    {
        given(events, "events").ensureHasValue().ensureIsArray().ensure(t => t.length > 0);
        given(initialState, "initialState").ensureIsObject();

        this._state = initialState || {} as any;

        this._retroEvents = events;
        this._retroEvents.orderBy(t => t.version).forEach(t => t.apply(this._state));
        this._retroVersion = this.currentVersion;
    }

    public static deserialize(aggregateType: Function, eventTypes: ReadonlyArray<Function>, data: AggregateRootData): AggregateRoot<AggregateState>
    {
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        given(eventTypes, "eventTypes").ensureHasValue().ensureIsArray()
            .ensure(t => t.length > 0, "no eventTypes provided")
            .ensure(t => t.map(u => (<Object>u).getTypeName()).distinct().length === t.length, "duplicate event types detected");
        given(data, "data").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
                $id: "string",
                $version: "number",
                $createdAt: "number",
                $updatedAt: "number",
                $events: [{
                    $name: "string",
                    $occurredAt: "number",
                    $version: "number"
                }]
            });
        
        const events = data.$events.map((eventData: any) =>
        {
            const name = eventData.$name;
            const event = eventTypes.find(t => (<Object>t).getTypeName() === name);
            if (!event)
                throw new ApplicationException(`No event type supplied for event with name '${name}'`);
            if (!(<any>event).deserializeEvent)
                throw new ApplicationException(`Event type '${name}' does not have a static deserializeEvent method defined.`);
            return (<any>event).deserializeEvent(eventData);
        });

        return new (<any>aggregateType)(events);
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


    protected applyEvent(event: DomainEvent<AggregateState>): void
    {
        event.apply(this._state);

        this._currentEvents.push(event);
    }
}