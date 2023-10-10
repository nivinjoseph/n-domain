import { AggregateState } from "./aggregate-state";
import { DomainEvent } from "./domain-event";
import { DomainEventData } from "./domain-event-data";
export declare class AggregateRebased<T extends AggregateState> extends DomainEvent<T> {
    private readonly _defaultState;
    private readonly _rebaseState;
    private readonly _rebaseVersion;
    get defaultState(): T;
    get rebaseState(): T;
    get rebaseVersion(): number;
    constructor(data: DomainEventData & Pick<AggregateRebased<T>, "defaultState" | "rebaseState" | "rebaseVersion">);
    protected applyEvent(state: T): void;
}
//# sourceMappingURL=aggregate-rebased.d.ts.map