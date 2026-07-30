import { AggregateState } from "../../src/aggregate-state.js";
import { AggregateStateFactory } from "../../src/aggregate-state-factory.js";
import { StateMigration } from "../../src/state-migration.js";
import { TodoDescription } from "./value-objects/todo-description.js";


export interface TodoState extends AggregateState
{
    title: string;
    description: TodoDescription | null;
    isCompleted: boolean;
}


export class TodoStateFactory extends AggregateStateFactory<TodoState>
{
    public create(): TodoState
    {
        return {
            ...this.createDefaultAggregateState(),
            title: null as any,
            description: null,
            isCompleted: false
        };
    }
}


/**
 * Simulates the CURRENT code after a breaking shape change: schema version 1 had the field
 * `legacyTitle`; version 2 renamed it to `title`. The migration step upcasts any stored
 * state artifact (snapshot, frozen default, rebase baseline) written at version 1.
 * schemaVersion is derived: defineMigrations().length + 1 === 2.
 */
export class MigratedTodoStateFactory extends TodoStateFactory
{
    protected override defineMigrations(): ReadonlyArray<StateMigration>
    {
        return [
            {
                // v1 -> v2: legacyTitle renamed to title. shape-tolerant: no-ops when the
                // source key is absent (e.g. an artifact that never carried the field).
                migrate: (payload) =>
                {
                    if ("legacyTitle" in payload)
                    {
                        payload["title"] = payload["legacyTitle"];
                        delete payload["legacyTitle"];
                    }
                    return payload;
                }
            }
        ];
    }
}
