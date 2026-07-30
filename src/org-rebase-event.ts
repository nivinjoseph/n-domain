import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { OrgAggregateState } from "./org-aggregate-state.js";
import { OrgDomainEvent } from "./org-domain-event.js";
import { OrgDomainEventData } from "./org-domain-event-data.js";
import { rebaseEventBrand } from "./rebase-event.js";


// public
export interface OrgRebaseEventData extends OrgDomainEventData
{
    $baseline: object;
    $rebaseVersion: number;
}


// public
/**
 * Organization-scoped counterpart of `RebaseEvent`. It must extend `OrgDomainEvent` (for the
 * organizationId stamping/consistency in apply() and to satisfy OrgAggregateRoot's applyEvent
 * guard), so it shares the rebase contract with `RebaseEvent` via the framework's internal
 * brand rather than inheritance. Subclasses contribute ONLY class identity and `refType`.
 */
export abstract class OrgRebaseEvent<T extends OrgAggregateState> extends OrgDomainEvent<T>
{
    private readonly _baseline: object;
    private readonly _rebaseVersion: number;


    @serialize("$baseline")
    public get baseline(): object { return this._baseline; }

    @serialize("$rebaseVersion")
    public get rebaseVersion(): number { return this._rebaseVersion; }


    public constructor(data: OrgRebaseEventData)
    {
        super(data);

        const { $baseline, $rebaseVersion } = data;

        given($baseline, "$baseline").ensureHasValue().ensureIsObject();
        this._baseline = $baseline;

        given($rebaseVersion, "$rebaseVersion").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0);
        this._rebaseVersion = $rebaseVersion;

        (this as Record<symbol, unknown>)[rebaseEventBrand] = true;

        // the no-op applyEvent below is a framework invariant, not a default — enforce it loudly
        given(this as OrgRebaseEvent<T>, "this").ensure(
            t => (t as any).applyEvent === (OrgRebaseEvent.prototype as any).applyEvent,
            "OrgRebaseEvent subclasses must not override applyEvent; the baseline is framework-applied with RESET semantics");
    }


    // enforced no-op (constructor-guarded): the RESET overlay is framework logic applied by
    // AggregateRoot before this event applies; subclasses carry no state-mutation logic of their own.
    protected applyEvent(_state: T): void
    {
        // deliberate no-op
    }
}
