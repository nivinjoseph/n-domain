import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject } from "./domain-object.js";
// public
let DomainEntity = (() => {
    var _a;
    let _classSuper = DomainObject;
    let _instanceExtraInitializers = [];
    let _get_id_decorators;
    return _a = class DomainEntity extends _classSuper {
            get id() { return this._id; }
            constructor(data) {
                super(data);
                this._id = __runInitializers(this, _instanceExtraInitializers);
                const { id } = data;
                given(id, "id").ensureHasValue().ensureIsString();
                this._id = id;
            }
        },
        (() => {
            var _b;
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _get_id_decorators = [serialize];
            __esDecorate(_a, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { DomainEntity };
//# sourceMappingURL=domain-entity.js.map