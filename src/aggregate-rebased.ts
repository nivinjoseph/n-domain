import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state";
import { AggregateStateHelper } from "./aggregate-state-helper";
import { DomainEvent } from "./domain-event";
import { DomainEventData } from "./domain-event-data";


export class AggregateRebased<T extends AggregateState> extends DomainEvent<T>
{
    private readonly _defaultState: object;
    private readonly _rebaseState: object;
    private readonly _rebaseVersion: number;
    
    
    @serialize
    public get defaultState(): object { return this._defaultState; }
    
    @serialize
    public get rebaseState(): object { return this._rebaseState; }
    
    @serialize
    public get rebaseVersion(): number { return this._rebaseVersion; }
    
    
    
    public constructor(data: AggregateRebasedEventData)
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
    
    
    protected applyEvent(state: T): void
    {
        given(state, "state").ensureHasValue().ensureIsObject();
        
        // current factory generated default state
        // layer base state on top of it
        // layer the above result on top of current state
        
        const defaultState = AggregateStateHelper.deserializeSnapshotIntoState(this._defaultState);
        const rebaseState = AggregateStateHelper.deserializeSnapshotIntoState(this._rebaseState);
        
        // console.dir(state);
        // console.dir(defaultState);
        // console.dir(rebaseState);
        
        Object.assign(state, defaultState, rebaseState);
        
        state.isRebased = true;
        state.rebasedFromVersion = this._rebaseVersion;
        
        // console.dir(state);
    }
}

export type AggregateRebasedEventData = DomainEventData
    & Pick<AggregateRebased<any>, "defaultState" | "rebaseState" | "rebaseVersion">;