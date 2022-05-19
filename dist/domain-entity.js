"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEntity = void 0;
const tslib_1 = require("tslib");
const domain_object_1 = require("./domain-object");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
// public
class DomainEntity extends domain_object_1.DomainObject {
    constructor(data) {
        super(data);
        const { id } = data;
        (0, n_defensive_1.given)(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
    get id() { return this._id; }
}
tslib_1.__decorate([
    n_util_1.serialize,
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [])
], DomainEntity.prototype, "id", null);
exports.DomainEntity = DomainEntity;
//# sourceMappingURL=domain-entity.js.map