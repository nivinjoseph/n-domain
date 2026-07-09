import { AggregateRoot } from "./aggregate-root.js";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
import { AggregateState } from "./aggregate-state.js";
import { DomainContext } from "./domain-context.js";
import { DomainEvent } from "./domain-event.js";
import { ClassDefinition } from "@nivinjoseph/n-util";
export declare class AggregateFactory<T extends AggregateRoot<TState, TDomainEvent>, TState extends AggregateState, TDomainEvent extends DomainEvent<TState>> {
    private readonly _aggregateType;
    private readonly _domainContext;
    private readonly _stateFactory;
    constructor(aggregateType: ClassDefinition<T>, domainContext: DomainContext, stateFactory: AggregateStateFactory<TState>);
    createFromEvents(events: ReadonlyArray<TDomainEvent>): T;
}
//# sourceMappingURL=aggregate-factory.d.ts.map