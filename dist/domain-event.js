import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Serializable, serialize } from "@nivinjoseph/n-util";
import { DomainHelper } from "./domain-helper.js";
import { AggregateRoot } from "./aggregate-root.js";
// public
let DomainEvent = (() => {
    var _a;
    let _classSuper = Serializable;
    let _instanceExtraInitializers = [];
    let _get_aggregateId_decorators;
    let _get_id_decorators;
    let _get_userId_decorators;
    let _get_name_decorators;
    let _get_occurredAt_decorators;
    let _get_version_decorators;
    let _get_isCreatedEvent_decorators;
    return _a = class DomainEvent extends _classSuper {
            get aggregateId() {
                given(this, "this").ensure(t => t._aggregateId != null, "accessing property before apply");
                return this._aggregateId;
            }
            get id() {
                given(this, "this").ensure(t => t._id != null, "accessing property before apply");
                return this._id;
            }
            get userId() {
                given(this, "this").ensure(t => t._userId != null, "accessing property before apply");
                return this._userId;
            }
            get name() { return this._name; }
            get partitionKey() { return this.aggregateId; } // n-eda compatibility
            get refId() { return this.aggregateId; } // n-eda compatibility
            get occurredAt() { return this._occurredAt; }
            get version() { return this._version; }
            get isCreatedEvent() { return this._isCreatedEvent; }
            // occurredAt is epoch milliseconds
            constructor(data) {
                super(data);
                this._aggregateId = (__runInitializers(this, _instanceExtraInitializers), void 0);
                const { $aggregateId, $id, $userId, $name, $occurredAt, $version, $isCreatedEvent } = data;
                given($aggregateId, "$aggregateId").ensureIsString();
                this._aggregateId = $aggregateId || null;
                given($id, "$id").ensureIsString();
                this._id = $id || null;
                given($userId, "$userId").ensureIsString();
                this._userId = $userId && !$userId.isEmptyOrWhiteSpace() ? $userId.trim() : null;
                this._name = this.getTypeName();
                if ($name && $name !== this._name)
                    throw new ApplicationException(`Deserialized event name '${$name}' does not match target type name '${this._name}'.`);
                given($occurredAt, "$occurredAt").ensureIsNumber();
                this._occurredAt = $occurredAt || DomainHelper.now;
                given($version, "$version").ensureIsNumber().ensure(t => t > 0);
                this._version = $version || 0;
                given($isCreatedEvent, "$isCreatedEvent").ensureIsBoolean();
                this._isCreatedEvent = !!$isCreatedEvent;
            }
            apply(aggregate, domainContext, state) {
                given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof AggregateRoot);
                given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
                given(state, "state").ensureHasValue().ensureIsObject();
                if (this._userId == null)
                    this._userId = domainContext.userId || "UNKNOWN";
                const version = this._version || (state.version + 1) || 1;
                this.applyEvent(state);
                if (this._isCreatedEvent)
                    state.createdAt = this._occurredAt;
                state.updatedAt = this._occurredAt;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (aggregate.id == null)
                    throw new ApplicationException("Created event is not setting the id of the aggregate");
                if (this._aggregateId != null && this._aggregateId !== aggregate.id)
                    throw new ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${aggregate.getTypeName()}' with id '${aggregate.id}'`);
                this._aggregateId = aggregate.id;
                state.version = this._version = version;
                const id = `${this._aggregateId}-${this._version}`;
                if (this._id != null && this._id !== id)
                    throw new ApplicationException(`Deserialized id '${this._id}' does not match computed id ${id}`);
                this._id = id;
            }
        },
        (() => {
            var _b;
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _get_aggregateId_decorators = [serialize("$aggregateId")];
            _get_id_decorators = [serialize("$id")];
            _get_userId_decorators = [serialize("$userId")];
            _get_name_decorators = [serialize("$name")];
            _get_occurredAt_decorators = [serialize("$occurredAt")];
            _get_version_decorators = [serialize("$version")];
            _get_isCreatedEvent_decorators = [serialize("$isCreatedEvent")];
            __esDecorate(_a, null, _get_aggregateId_decorators, { kind: "getter", name: "aggregateId", static: false, private: false, access: { has: obj => "aggregateId" in obj, get: obj => obj.aggregateId }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_userId_decorators, { kind: "getter", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_name_decorators, { kind: "getter", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_occurredAt_decorators, { kind: "getter", name: "occurredAt", static: false, private: false, access: { has: obj => "occurredAt" in obj, get: obj => obj.occurredAt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_version_decorators, { kind: "getter", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _get_isCreatedEvent_decorators, { kind: "getter", name: "isCreatedEvent", static: false, private: false, access: { has: obj => "isCreatedEvent" in obj, get: obj => obj.isCreatedEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { DomainEvent };
//# sourceMappingURL=domain-event.js.map