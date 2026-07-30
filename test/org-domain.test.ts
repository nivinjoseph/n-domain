import "@nivinjoseph/n-ext";
import assert from "node:assert";
import { describe, test } from "node:test";
import { OrgDomainContext } from "../src/index.js";
import { OrgTodo, OrgTodoStateFactory } from "./domain/org-todo.js";


await describe("Org aggregate tests", async () =>
{
    const orgDomainContext: OrgDomainContext = { userId: "dev", organizationId: "org_1" };

    await test(`
        Given an org aggregate that has been updated twice,
        When it is rebased to version 2, serialized, and replayed,
        Then the rebase event should carry $organizationId and a $baseline,
            and the replayed aggregate should preserve title, organizationId, and rebase metadata,
            and the full round-trip self-check should pass
    `,
        () =>
        {
            const original = OrgTodo.create(orgDomainContext, "title");
            original.updateTitle("title update 1");
            original.updateTitle("title update 2");

            original.rebase(2);

            assert.strictEqual(original.isRebased, true);
            assert.strictEqual(original.rebasedFromVersion, 2);
            assert.strictEqual(original.title, "title update 1");
            assert.strictEqual(original.organizationId, "org_1");

            const serialized = original.serialize();
            const rebaseEventData = serialized.$events
                .find(e => (e as Record<string, any>)["$baseline"] != null) as Record<string, any> | undefined;
            assert.ok(rebaseEventData != null, "expected a rebase event in the stream");
            assert.strictEqual(rebaseEventData["$organizationId"], "org_1",
                "org rebase event must persist $organizationId");

            const replayed = OrgTodo.deserializeFromEvents(
                orgDomainContext, OrgTodo, new OrgTodoStateFactory(orgDomainContext), serialized.$events);

            assert.strictEqual(replayed.id, original.id);
            assert.strictEqual(replayed.title, "title update 1");
            assert.strictEqual(replayed.organizationId, "org_1");
            assert.strictEqual(replayed.isRebased, true);
            assert.strictEqual(replayed.rebasedFromVersion, 2);

            replayed.test();
        });
});
