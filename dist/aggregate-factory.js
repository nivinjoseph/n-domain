import { given } from "@nivinjoseph/n-defensive";
/**
 * Preferred way to instantiate aggregates — from a single created event (new aggregate) or a full
 * event stream (rehydration).
 *
 * The aggregate class is invoked positionally as `new type(domainContext, events, stateFactory)`
 * — a contract `ClassDefinition<T>` cannot express — so aggregate subclasses must preserve
 * `AggregateRoot`'s exact constructor signature `(domainContext, events, stateFactory, currentState?)`.
 */
export class AggregateFactory {
    _aggregateType;
    _domainContext;
    _stateFactory;
    constructor(aggregateType, domainContext, stateFactory) {
        given(aggregateType, "aggregateType").ensureHasValue().ensureIsFunction();
        this._aggregateType = aggregateType;
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject();
        this._domainContext = domainContext;
        given(stateFactory, "stateFactory").ensureHasValue().ensureIsObject();
        this._stateFactory = stateFactory;
    }
    createFromEvents(events) {
        given(events, "events").ensureHasValue().ensureIsArray().ensureIsNotEmpty();
        return new this._aggregateType(this._domainContext, events, this._stateFactory);
    }
}
//# sourceMappingURL=aggregate-factory.js.map