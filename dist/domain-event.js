import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException } from "@nivinjoseph/n-exception";
import { Serializable, serialize } from "@nivinjoseph/n-util";
import { AggregateStateHelper } from "./aggregate-state-helper.js";
import { DomainHelper } from "./domain-helper.js";
import { AggregateRoot } from "./aggregate-root.js";
// public
/**
 * Base class for domain events — the only mechanism through which aggregate state changes.
 *
 * Contracts the type system cannot express:
 * - Decorate every concrete event class with `@serialize("YourNamespace")` (and each payload
 *   getter with `@serialize`), or replay/deserialization fails at runtime.
 * - The event **class name is the persisted identity** (`$name`); renaming an event class breaks
 *   deserialization of already-stored streams.
 * - A created event's constructor must set `data.$isCreatedEvent = true` **before** calling
 *   `super(data)`, and its `applyEvent` must set `state.id`.
 * - Implement `refType` with a string literal of the aggregate's type name; importing the
 *   aggregate class to call `Aggregate.getTypeName()` creates a fatal circular dependency.
 * - `aggregateId`, `id`, and `userId` are populated by `apply()`; accessing them earlier throws.
 *
 * @typeParam T - the aggregate state this event mutates
 */
let DomainEvent = (() => {
    let _classSuper = Serializable;
    let _instanceExtraInitializers = [];
    let _get_aggregateId_decorators;
    let _get_id_decorators;
    let _get_userId_decorators;
    let _get_name_decorators;
    let _get_occurredAt_decorators;
    let _get_version_decorators;
    let _get_isCreatedEvent_decorators;
    return class DomainEvent extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_aggregateId_decorators = [serialize("$aggregateId")];
            _get_id_decorators = [serialize("$id")];
            _get_userId_decorators = [serialize("$userId")];
            _get_name_decorators = [serialize("$name")];
            _get_occurredAt_decorators = [serialize("$occurredAt")];
            _get_version_decorators = [serialize("$version")];
            _get_isCreatedEvent_decorators = [serialize("$isCreatedEvent")];
            __esDecorate(this, null, _get_aggregateId_decorators, { kind: "getter", name: "aggregateId", static: false, private: false, access: { has: obj => "aggregateId" in obj, get: obj => obj.aggregateId }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_userId_decorators, { kind: "getter", name: "userId", static: false, private: false, access: { has: obj => "userId" in obj, get: obj => obj.userId }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_name_decorators, { kind: "getter", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_occurredAt_decorators, { kind: "getter", name: "occurredAt", static: false, private: false, access: { has: obj => "occurredAt" in obj, get: obj => obj.occurredAt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_version_decorators, { kind: "getter", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_isCreatedEvent_decorators, { kind: "getter", name: "isCreatedEvent", static: false, private: false, access: { has: obj => "isCreatedEvent" in obj, get: obj => obj.isCreatedEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        _aggregateId = __runInitializers(this, _instanceExtraInitializers);
        _id; // _aggregateId-_version
        _userId; // who
        _name; // what
        _occurredAt; // when
        _version;
        _isCreatedEvent;
        // serialized create() defaults (base fields stripped); created events only. set on deserialize via the
        // constructor, and on the new-aggregate path by the AggregateRoot constructor through an `any` cast (the
        // same idiom used for _aggregateId), so this stamping stays off DomainEvent's public surface — hence not readonly.
        // eslint-disable-next-line @typescript-eslint/prefer-readonly
        _frozenDefaultState;
        /** @throws "accessing property before apply" until the event has been applied to an aggregate. */
        get aggregateId() {
            given(this, "this").ensure(t => t._aggregateId != null, "accessing property before apply");
            return this._aggregateId;
        }
        /**
         * Unique event identifier of the form `aggregateId-version`.
         * @throws "accessing property before apply" until the event has been applied to an aggregate.
         */
        get id() {
            given(this, "this").ensure(t => t._id != null, "accessing property before apply");
            return this._id;
        }
        /** @throws "accessing property before apply" until the event has been applied to an aggregate. */
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
            const { $aggregateId, $id, $userId, $name, $occurredAt, $version, $isCreatedEvent, $frozenDefaultState } = data;
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
            given($frozenDefaultState, "$frozenDefaultState").ensureIsObject();
            this._frozenDefaultState = $frozenDefaultState ?? null;
        }
        /**
         * Framework-internal, called by `AggregateRoot` — do not call directly. Stamps
         * `userId`/`version`/`id`, overlays a created event's `$frozenDefaultState`, invokes
         * `applyEvent`, and updates `createdAt`/`updatedAt`.
         * @throws ApplicationException if the created event did not set the aggregate's id, or if the
         * event's `aggregateId`/`id` do not match the aggregate it is being applied to.
         */
        apply(aggregate, domainContext, state) {
            given(aggregate, "aggregate").ensureHasValue().ensureIsObject().ensure(t => t instanceof AggregateRoot);
            given(domainContext, "domainContext").ensureHasValue().ensureHasStructure({ userId: "string" });
            given(state, "state").ensureHasValue().ensureIsObject();
            if (this._userId == null)
                this._userId = domainContext.userId || "UNKNOWN";
            const version = this._version || (state.version + 1) || 1;
            // a created event carrying frozen default state overlays the historical create() defaults
            // (base fields stripped) onto the current-code base before its own applyEvent sets real values.
            // this isolates replay from future create() default changes for fields no event writes.
            if (this._isCreatedEvent && this._frozenDefaultState != null)
                Object.assign(state, AggregateStateHelper.deserializeSnapshotIntoState(this._frozenDefaultState));
            this.applyEvent(state);
            if (this._isCreatedEvent)
                state.createdAt = this._occurredAt;
            state.updatedAt = this._occurredAt;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (aggregate.id == null)
                throw new ApplicationException("Created event did not set the id of the aggregate");
            if (this._aggregateId != null && this._aggregateId !== aggregate.id)
                throw new ApplicationException(`Event of type '${this._name}' with id ${this._id} and aggregateId '${this._aggregateId}' is being applied on Aggregate of type '${aggregate.getTypeName()}' with id '${aggregate.id}'`);
            this._aggregateId = aggregate.id;
            state.version = this._version = version;
            const id = `${this._aggregateId}-${this._version}`;
            if (this._id != null && this._id !== id)
                throw new ApplicationException(`Deserialized id '${this._id}' does not match computed id ${id}`);
            this._id = id;
        }
        serialize() {
            const data = super.serialize();
            // only created events carry frozen default state; keep every other event's serialized shape unchanged
            if (this._isCreatedEvent && this._frozenDefaultState != null)
                data.$frozenDefaultState = this._frozenDefaultState;
            return data;
        }
    };
})();
export { DomainEvent };
//# sourceMappingURL=domain-event.js.map