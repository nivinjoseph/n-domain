import { given } from "@nivinjoseph/n-defensive";
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
    createFromState(state) {
        given(state, "state").ensureHasValue().ensureIsObject();
        return new this._aggregateType(this._domainContext, [], this._stateFactory, state);
    }
}
//# sourceMappingURL=aggregate-factory.js.map