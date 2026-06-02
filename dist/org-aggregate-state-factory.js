import { given } from "@nivinjoseph/n-defensive";
import { AggregateStateFactory } from "./aggregate-state-factory.js";
export class OrgAggregateStateFactory extends AggregateStateFactory {
    _orgDomainContext;
    constructor(orgDomainContext) {
        super();
        given(orgDomainContext, "orgDomainContext").ensureHasValue().ensureIsObject();
        this._orgDomainContext = orgDomainContext;
    }
    createDefaultAggregateState() {
        return {
            ...super.createDefaultAggregateState(),
            organizationId: this._orgDomainContext.organizationId
        };
    }
}
//# sourceMappingURL=org-aggregate-state-factory.js.map