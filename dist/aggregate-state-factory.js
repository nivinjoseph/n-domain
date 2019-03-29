"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AggregateStateFactory {
    createDefaultAggregateState() {
        return {
            typeVersion: 1,
            id: null,
            version: null,
            createdAt: null,
            updatedAt: null,
        };
    }
}
exports.AggregateStateFactory = AggregateStateFactory;
//# sourceMappingURL=aggregate-state-factory.js.map