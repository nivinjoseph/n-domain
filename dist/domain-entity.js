"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domain_object_1 = require("./domain-object");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
// public
class DomainEntity extends domain_object_1.DomainObject {
    constructor(id) {
        super();
        n_defensive_1.given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
    get id() { return this._id; }
}
exports.DomainEntity = DomainEntity;
//# sourceMappingURL=domain-entity.js.map