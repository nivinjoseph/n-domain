import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { AggregateState } from "./aggregate-state";
import { DomainEvent } from "./domain-event";
import { DomainEventData } from "./domain-event-data";


export class AggregateRebased<T extends AggregateState> extends DomainEvent<T>
{
    private readonly _defaultState: T;
    private readonly _rebaseState: T;
    private readonly _rebaseVersion: number;
    
    
    @serialize
    public get defaultState(): T { return this._defaultState; }
    
    @serialize
    public get rebaseState(): T { return this._rebaseState; }
    
    @serialize
    public get rebaseVersion(): number { return this._rebaseVersion; }
    
    
    
    public constructor(data: DomainEventData & Pick<AggregateRebased<T>, "defaultState" | "rebaseState" | "rebaseVersion">)
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
        
        // console.dir(state);
        // console.dir(this._defaultState);
        // console.dir(this._rebaseState);
        
        Object.assign(state, this._defaultState, this._rebaseState);
        
        state.isRebased = true;
        state.rebasedFromVersion = this._rebaseVersion;
        
        // console.dir(state);
    }
}