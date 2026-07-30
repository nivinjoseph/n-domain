import { given } from "@nivinjoseph/n-defensive";

// public
export interface AggregateState
{
    id: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    isRebased: boolean;
    rebasedFromVersion: number;

    // ^^^^^ any change to this should also affect BASE_STATE_KEYS below
}

// public
// single source of truth for the framework-owned base fields; everything else on a state is a domain key
export const BASE_STATE_KEYS: ReadonlyArray<string> = [
    "id",
    "version",
    "createdAt",
    "updatedAt",
    "isRebased",
    "rebasedFromVersion"
];

export function clearBaseState(state: object): void
{
    given(state, "state").ensureHasValue().ensureIsObject();

    BASE_STATE_KEYS.forEach(key =>
    {
        delete (state as Record<string, unknown>)[key];
    });

    // legacy hygiene: artifacts persisted before schema versioning carried typeVersion in-band
    delete (state as Record<string, unknown>)["typeVersion"];
}
