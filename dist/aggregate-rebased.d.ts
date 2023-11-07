import { AggregateState } from "./aggregate-state";
import { DomainEvent } from "./domain-event";
import { DomainEventData } from "./domain-event-data";
export declare class AggregateRebased<T extends AggregateState> extends DomainEvent<T> {
    private readonly _defaultState;
    private readonly _rebaseState;
    private readonly _rebaseVersion;
    get defaultState(): object;
    get rebaseState(): object;
    get rebaseVersion(): number;
    constructor(data: AggregateRebasedEventData);
    protected applyEvent(state: T): void;
}
export declare type AggregateRebasedEventData = DomainEventData & Pick<AggregateRebased<any>, "defaultState" | "rebaseState" | "rebaseVersion">;
//# sourceMappingURL=aggregate-rebased.d.ts.map