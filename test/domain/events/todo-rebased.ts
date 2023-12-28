import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { AggregateStateHelper, DomainEventData } from "../../../src/index.js";
import { TodoState } from "../todo-state.js";
import { TodoDomainEvent } from "./todo-domain-event.js";



@serialize()
export class TodoRebased extends TodoDomainEvent
{
    private readonly _defaultState: object;
    private readonly _rebaseState: object;
    private readonly _rebaseVersion: number;


    @serialize()
    public get defaultState(): object { return this._defaultState; }

    @serialize()
    public get rebaseState(): object { return this._rebaseState; }

    @serialize()
    public get rebaseVersion(): number { return this._rebaseVersion; }


    public constructor(data: DomainEventData & Pick<TodoRebased, "defaultState" | "rebaseState" | "rebaseVersion">)
    {
        super(data);

        const { defaultState, rebaseState, rebaseVersion } = data;

        given(defaultState, "defaultState").ensureHasValue().ensureIsObject();
        this._defaultState = defaultState;

        given(rebaseState, "rebaseState").ensureHasValue().ensureIsObject();
        this._rebaseState = rebaseState;

        given(rebaseVersion, "rebaseVersion").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0);
        this._rebaseVersion = rebaseVersion;
    }


    protected applyEvent(state: TodoState): void
    {
        AggregateStateHelper.rebaseState(
            state,
            this._defaultState,
            this._rebaseState,
            this._rebaseVersion
        );
    }
}