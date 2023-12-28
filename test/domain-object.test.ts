import assert from "node:assert";
import { describe, test } from "node:test";
import { TestDomainObject } from "./domain/test-domain-object.js";


await describe("DomainObject tests", async () =>
{
    await test("equality check", () =>
    {
        const foo = new TestDomainObject({ id: "foo", name: "i am foo" });
        const bar = new TestDomainObject({ id: "bar", name: "i am foo" });
        const baz = new TestDomainObject({ id: "bar", name: "i am foo" });

        assert.ok(foo.equals(foo));
        assert.ok(!foo.equals(bar));
        assert.ok(bar.equals(baz));
    });
});