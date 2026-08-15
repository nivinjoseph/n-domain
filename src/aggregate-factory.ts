import { given } from "@nivinjoseph/n-defensive";
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
export class AggregateFactory<T extends AggregateRoot<TState, TDomainEvent>, TState extends AggregateState, TDomainEvent extends DomainEvent<TState>>
{
    private readonly _aggregateType: ClassDefinition<T>;
    private readonly _domainContext: DomainContext;
    private readonly _stateFactory: AggregateStateFactory<TState>;
    
    
    public constructor(aggregateType: ClassDefinition<T>, domainContext: DomainContext, stateFactory: AggregateStateFactory<TState>)
    { 
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        this._aggregateType = aggregateType;
        
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        this._domainContext = domainContext;
        
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        this._stateFactory = stateFactory;
    }
    
    public createFromEvents(events: ReadonlyArray<TDomainEvent>): T 
    {
        given(events, "events").ensureHasValue().ensureIsArray().ensureIsNotEmpty();
        
        return new this._aggregateType(this._domainContext, events, this._stateFactory);
    }
}