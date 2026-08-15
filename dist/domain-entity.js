import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "./domain-object.js";
// public
/**
 * Base class for entities — domain objects with identity, compared by `id` rather than state
 * (use `deepEquals` for state comparison).
 *
 * Follows the same self-referential generic idiom as {@link DomainObject}: pass the class itself
 * as `TThis` and its `@serialize` decorated getter names as `TDataKeys`. `"id"` is added to the
 * data keys automatically, so subclass constructors always receive an `id: string` in their data.
 *
 * @typeParam TThis - the concrete subclass itself (must have an `id: string`)
 * @typeParam TDataKeys - union of the subclass's `@serialize` decorated getter names, excluding `id`
 */
let DomainEntity = (() => {
    let _classSuper = DomainObject;
    let _instanceExtraInitializers = [];
    let _get_id_decorators;
    return class DomainEntity extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_id_decorators = [serialize];
            __esDecorate(this, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        _id = __runInitializers(this, _instanceExtraInitializers);
        get id() { return this._id; }
        constructor(data) {
            super(data);
            // the mapped type is opaque while TThis is unresolved, but "id" is guaranteed in it
            const { id } = data;
            given(id, "id").ensureHasValue().ensureIsString();
            this._id = id;
        }
        /**
         * Entities are compared by identity, not state.
         * @param value (the value to compare)
         */
        equals(value) {
            if (value == null)
                return false;
            if (value === this)
                return true;
            if (value.getTypeName() !== this.getTypeName())
                return false;
            return value.id === this._id;
        }
        /**
         * Entities are compared by state, including identity.
         * @param value (the value to compare)
         */
        deepEquals(value) {
            return super.equals(value);
        }
    };
})();
export { DomainEntity };
//# sourceMappingURL=domain-entity.js.map