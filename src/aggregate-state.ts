import { given } from "@nivinjoseph/n-defensive";

// public
export interface AggregateState
{
    readonly typeVersion: number;
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    isRebased: boolean;
    rebasedFromVersion: number;
    
    // ^^^^^ any change to this should also affect the clearBaseState function below
}

export function clearBaseState(state: AggregateState): void
{
    given(state, "state").ensureHasValue().ensureIsObject();
    
    // @ts-expect-error: deliberate
    delete state.typeVersion;
    // @ts-expect-error: deliberate
    delete state.id;
    // @ts-expect-error: deliberate
    delete state.version;
    // @ts-expect-error: deliberate
    delete state.createdAt;
    // @ts-expect-error: deliberate
    delete state.updatedAt;
    // @ts-expect-error: deliberate
    delete state.isRebased;
    // @ts-expect-error: deliberate
    delete state.rebasedFromVersion;
}