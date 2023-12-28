import assert from "node:assert";
import { describe, test } from "node:test";
import { TestDomainObject } from "./domain/test-domain-object.js";
import { Deserializer } from "@nivinjoseph/n-util";


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
    
    await test("serialization test", () =>
    {
        const foo = new TestDomainObject({ id: "foo", name: "i am foo" });
        
        const serialized = foo.serialize();
        console.log(serialized);

        const deserialized = Deserializer.deserialize<TestDomainObject>(serialized);
        assert.ok(deserialized instanceof TestDomainObject);
        assert.strictEqual(deserialized.id, foo.id);
        assert.strictEqual(deserialized.name, foo.name);
        assert.strictEqual(deserialized.id, foo.id);
    });
});