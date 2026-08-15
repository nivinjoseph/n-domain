import { AggregateRoot } from "./aggregate-root.js";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { AggregateState } from "./aggregate-state.js";
import { DomainContext } from "./domain-context.js";
import { DomainEvent } from "./domain-event.js";
import { ClassDefinition } from "@nivinjoseph/n-util";
/**
 * Preferred way to instantiate aggregates — from a single created event (new aggregate) or a full
 * event stream (rehydration).
 *
 * The aggregate class is invoked positionally as `new type(domainContext, events, stateFactory)`
 * — a contract `ClassDefinition<T>` cannot express — so aggregate subclasses must preserve
 * `AggregateRoot`'s exact constructor signature `(domainContext, events, stateFactory, currentState?)`.
 */
export declare class AggregateFactory<T extends AggregateRoot<TState, TDomainEvent>, TState extends AggregateState, TDomainEvent extends DomainEvent<TState>> {
    private readonly _aggregateType;
    private readonly _domainContext;
    private readonly _stateFactory;
    constructor(aggregateType: ClassDefinition<T>, domainContext: DomainContext, stateFactory: AggregateStateFactory<TState>);
    createFromEvents(events: ReadonlyArray<TDomainEvent>): T;
}
//# sourceMappingURL=aggregate-factory.d.ts.map