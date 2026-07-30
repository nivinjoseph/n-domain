import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state.js";
import { DomainEvent } from "./domain-event.js";
import { DomainEventData } from "./domain-event-data.js";


// public
export interface RebaseEventData extends DomainEventData
{
    // complete base-stripped state at the rebase version, snapshot-serialized and stamped with
    // $schemaVersion. produced by AggregateRoot.rebase() — user code never fabricates this.
    $baseline: object;
    $rebaseVersion: number;
}


// shared brand so the framework seams recognize both RebaseEvent and OrgRebaseEvent (which cannot
// share a base class beyond DomainEvent) without instanceof coupling. module-internal.
export const rebaseEventBrand = Symbol.for("@nivinjoseph/n-domain/rebase-event");

export interface RebaseEventPayload
{
    readonly baseline: object;
    readonly rebaseVersion: number;
}

export function isRebaseEvent(event: object): event is RebaseEventPayload
{
    return (event as Record<symbol, unknown>)[rebaseEventBrand] === true;
}


// public
/**
 * Framework-owned rebase event. Subclasses contribute ONLY class identity (the `@serialize`
 * name binding for stored events) and `refType` — the baseline payload is framework-produced
 * by `AggregateRoot.rebase()` and framework-applied at the replay seam with RESET semantics
 * (all domain keys are cleared and re-baselined, so no residue from earlier overlays survives).
 * For organization-scoped aggregates use `OrgRebaseEvent` instead.
 */
export abstract class RebaseEvent<T extends AggregateState> extends DomainEvent<T>
{
    private readonly _baseline: object;
    private readonly _rebaseVersion: number;


    @serialize("$baseline")
    public get baseline(): object { return this._baseline; }

    @serialize("$rebaseVersion")
    public get rebaseVersion(): number { return this._rebaseVersion; }


    public constructor(data: RebaseEventData)
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
        given(this as RebaseEvent<T>, "this").ensure(
            t => (t as any).applyEvent === (RebaseEvent.prototype as any).applyEvent,
            "RebaseEvent subclasses must not override applyEvent; the baseline is framework-applied with RESET semantics");
    }


    // enforced no-op (constructor-guarded): the RESET overlay is framework logic applied by
    // AggregateRoot before this event applies; subclasses carry no state-mutation logic of their own.
    protected applyEvent(_state: T): void
    {
        // deliberate no-op
    }
}
