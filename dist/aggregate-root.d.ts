import { DomainEvent } from "./domain-event";
import { AggregateState } from "./aggregate-state";
import { AggregateRootData } from "./aggregate-root-data";
import { DomainContext } from "./domain-context";
import { DomainEventData } from "./domain-event-data";
import { AggregateStateFactory } from "./aggregate-state-factory";
import { Serializable } from "@nivinjoseph/n-util";
export declare abstract class AggregateRoot<T extends AggregateState> extends Serializable<AggregateRootData> {
    private readonly _domainContext;
    private readonly _stateFactory;
    private readonly _state;
    private readonly _retroEvents;
    private readonly _retroVersion;
    private readonly _currentEvents;
    private readonly _isNew;
    protected get state(): T;
    get context(): DomainContext;
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
    protected constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<T>>, stateFactory: AggregateStateFactory<T>, currentState?: T);
    static deserializeFromEvents<TAggregate extends AggregateRoot<TAggregateState>, TAggregateState extends AggregateState>(domainContext: DomainContext, aggregateType: new (...args: Array<any>) => TAggregate, eventData: ReadonlyArray<DomainEventData>): TAggregate;
    static deserializeFromSnapshot<TAggregate extends AggregateRoot<TAggregateState>, TAggregateState extends AggregateState>(domainContext: DomainContext, aggregateType: new (...args: Array<any>) => TAggregate, stateFactory: AggregateStateFactory<TAggregateState>, stateSnapshot: TAggregateState | object): TAggregate;
    snapshot(...cloneKeys: Array<string>): T | object;
    constructVersion(version: number): this;
    constructBefore(dateTime: number): this;
    hasEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean;
    hasRetroEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean;
    hasCurrentEventOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): boolean;
    getEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>;
    getRetroEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>;
    getCurrentEventsOfType<TEventType extends DomainEvent<T>>(eventType: new (...args: Array<any>) => TEventType): Array<TEventType>;
    /**
     *
     * @param domainContext - provide the Domain Context
     * @param createdEvent - provide a new created event to be used by the clone
     * @param serializedEventMutatorAndFilter - provide a function that can mutate the serialized event if required and returns a boolean indicating whether to include the event or not.
     * @returns - cloned Aggregate
     */
    clone(domainContext: DomainContext, createdEvent: DomainEvent<T>, serializedEventMutatorAndFilter?: (event: {
        $name: string;
    }) => boolean): this;
    test(): void;
    protected applyEvent(event: DomainEvent<T>): void;
    private _serializeForSnapshot;
}
//# sourceMappingURL=aggregate-root.d.ts.map