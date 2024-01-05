import { given } from "@nivinjoseph/n-defensive";
export function clearBaseState(state) {
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
//# sourceMappingURL=aggregate-state.js.map