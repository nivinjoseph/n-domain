import assert from "node:assert";
import { describe, test } from "node:test";
import { TestDomainEntity } from "./domain/test-domain-entity.js";
import { TestDomainObject } from "./domain/test-domain-object.js";


await describe("DomainEntity tests", async () =>
{
    await test("equality check", () =>
    {
        const foo = new TestDomainEntity({ id: "foo", name: "i am foo" });
        const bar = new TestDomainEntity({ id: "bar", name: "i am foo" });
        const renamedFoo = foo.updateName("i am renamed foo");

        assert.ok(foo.equals(foo));
        assert.ok(!foo.equals(bar));
        assert.ok(foo.equals(renamedFoo)); // same id, different state => same entity
        assert.ok(!foo.equals(null));
        assert.ok(!foo.equals(new TestDomainObject({ id: "foo", name: "i am foo" }))); // different type
    });
});
