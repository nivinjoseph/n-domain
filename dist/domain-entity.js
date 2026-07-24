import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "./domain-object.js";
// public
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