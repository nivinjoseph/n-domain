import { DomainEvent } from "./domain-event";
import { AggregateState } from "./aggregate-state";
import { AggregateRootData } from "./aggregate-root-data";
import "@nivinjoseph/n-ext";
import { DomainContext } from "./domain-context";
import { DomainEventData } from "./domain-event-data";
import { AggregateStateFactory } from "./aggregate-state-factory";
import { Serializable } from "@nivinjoseph/n-util";
export declare abstract class AggregateRoot<T extends AggregateState> extends Serializable {
    private readonly _domainContext;
    private readonly _stateFactory;
    private readonly _state;
    private _retroEvents;
    private readonly _retroVersion;
    private readonly _currentEvents;
    private readonly _isNew;
    get id(): string;
    get retroEvents(): ReadonlyArray<DomainEvent<T>>;
    get retroVersion(): number;
    get currentEvents(): ReadonlyArray<DomainEvent<T>>;
    get currentVersion(): number;
    get events(): ReadonlyArray<DomainEvent<T>>;
    get version(): number;
    get createdAt(): number;
    get updatedAt(): number;
    get isNew(): boolean;
    get hasChanges(): boolean;
    protected get context(): DomainContext;
    protected get state(): T;
    constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>, stateFactory: AggregateStateFactory<T>, currentState?: T);
    static deserializeFromEvents<TAggregate extends AggregateRoot<TAggregateState>, TAggregateState extends AggregateState>(domainContext: DomainContext, aggregateType: new (...args: any[]) => TAggregate, eventData: ReadonlyArray<DomainEventData>): TAggregate;
    serialize(): AggregateRootData;
    static deserializeFromSnapshot<TAggregate extends AggregateRoot<TAggregateState>, TAggregateState extends AggregateState>(domainContext: DomainContext, aggregateType: new (...args: any[]) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, stateSnapshot: TAggregateState | object): TAggregate;
    snapshot(...cloneKeys: string[]): T | object;
    constructVersion(version: number): this;
    hasEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: any[]) => TEventType): boolean;
    hasRetroEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: any[]) => TEventType): boolean;
    hasCurrentEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: any[]) => TEventType): boolean;
    getEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: any[]) => TEventType): ReadonlyArray<TEventType>;
    getRetroEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: any[]) => TEventType): ReadonlyArray<TEventType>;
    getCurrentEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: any[]) => TEventType): ReadonlyArray<TEventType>;
    test(): void;
    protected applyEvent(event: DomainEvent<T>): void;
    /**
     *
     * @deprecated DO NOT USE
     * @description override to trim retro events on the application of a new event
     */
    private serializeForSnapshot;
}
