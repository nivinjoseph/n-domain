import { DomainEvent } from "./domain-event";
import { AggregateState } from "./aggregate-state";
import { AggregateRootData } from "./aggregate-root-data";
import "@nivinjoseph/n-ext";
export declare abstract class AggregateRoot<T extends AggregateState> {
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
    protected readonly state: T;
    constructor(events: ReadonlyArray<DomainEvent<AggregateState>>, initialState?: T | object);
    static deserialize(aggregateType: Function, eventTypes: ReadonlyArray<Function>, data: AggregateRootData): AggregateRoot<AggregateState>;
    serialize(): AggregateRootData;
    protected applyEvent(event: DomainEvent<AggregateState>): void;
}
