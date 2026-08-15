import { given } from "@nivinjoseph/n-defensive";
import { AggregateRoot } from "./aggregate-root.js";
import { OrgDomainEvent } from "./org-domain-event.js";
/**
 * Organization-scoped aggregate root: requires an `OrgDomainContext`, exposes `organizationId`,
 * and accepts only `OrgDomainEvent`s in `applyEvent`.
 */
export class OrgAggregateRoot extends AggregateRoot {
    get organizationId() { return this.state.organizationId; }
    constructor(domainContext, events, stateFactory, state) {
        given(domainContext, "domainContext").ensureHasValue().ensureIsObject()
            .ensureHasStructure({
            organizationId: "string"
        });
        super(domainContext, events, stateFactory, state);
    }
    applyEvent(event) {
        given(event, "event").ensureHasValue().ensureIsObject().ensureIsInstanceOf(OrgDomainEvent);
        super.applyEvent(event);
    }
}
//# sourceMappingURL=org-aggregate-root.js.map