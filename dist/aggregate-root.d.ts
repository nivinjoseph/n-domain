import { DomainEvent } from "./domain-event";
import { AggregateState } from "./aggregate-state";
import { AggregateRootData } from "./aggregate-root-data";
import "@nivinjoseph/n-ext";
import { DomainContext } from "./domain-context";
export declare abstract class AggregateRoot<T extends AggregateState> {
    private readonly _domainContext;
    private readonly _state;
    private readonly _retroEvents;
    private readonly _retroVersion;
    private readonly _currentEvents;
    readonly id: string;
    readonly retroEvents: ReadonlyArray<DomainEvent<T>>;
    readonly retroVersion: number;
    readonly currentEvents: ReadonlyArray<DomainEvent<T>>;
    readonly currentVersion: number;
    readonly events: ReadonlyArray<DomainEvent<T>>;
    readonly version: number;
    abstract readonly createdAt: number;
    readonly updatedAt: number;
    readonly hasChanges: boolean;
    protected readonly context: DomainContext;
    protected readonly state: T;
    constructor(domainContext: DomainContext, events: ReadonlyArray<DomainEvent<AggregateState>>, initialState?: T | object);
    static deserialize(domainContext: DomainContext, aggregateType: Function, eventTypes: ReadonlyArray<Function>, data: AggregateRootData): AggregateRoot<AggregateState>;
    serialize(): AggregateRootData;
    constructVersion(version: number): this;
    protected applyEvent(event: DomainEvent<AggregateState>): void;
}
