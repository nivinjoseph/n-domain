"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEntity = void 0;
const domain_object_1 = require("./domain-object");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
// public
class DomainEntity extends domain_object_1.DomainObject {
    constructor(data) {
        super(data);
        const { id } = data;
        n_defensive_1.given(id, "id").ensureHasValue().ensureIsString();
        this._id = id;
    }
    get id() { return this._id; }
}
__decorate([
    n_util_1.serialize(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], DomainEntity.prototype, "id", null);
exports.DomainEntity = DomainEntity;
//# sourceMappingURL=domain-entity.js.map