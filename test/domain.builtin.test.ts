import assert from "node:assert";
import { describe, test } from "node:test";
import { DomainContext } from "../src/domain-context.js";
import { Todo } from "./domain/todo.js";

await describe("Domain Builtin test", async () =>
{
    const domainContext: DomainContext = { userId: "dev" };

    await test("Built in sanity check", () =>
    {
        const todo = Todo.create(domainContext, "title", "description");
        todo.updateTitle("My title");
        todo.updateDescription("My description");
        todo.markAsCompleted();

        todo.test();

        assert.ok(true);
    });
});