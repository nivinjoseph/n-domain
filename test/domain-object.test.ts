import assert from "node:assert";
import { describe, test } from "node:test";
import { TestDomainObject } from "./domain/test-domain-object.js";
import { Deserializer, serialize } from "@nivinjoseph/n-util";
import { DomainObject, DomainObjectData } from "../src/index.js";


@serialize("Test")
class BogusDomainObject extends DomainObject<BogusDomainObject, "name" | "bogus">
{
    private readonly _name: string;


    @serialize
    public get name(): string { return this._name; }

    // deliberately NOT @serialize decorated, but included in TDataKeys above
    public get bogus(): number { return 6; }


    public constructor(data: DomainObjectData<BogusDomainObject>)
    {
        super(data);

        this._name = data.name;
    }
}


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

    await test("construction throws when data contains a non @serialize decorated property", () =>
    {
        assert.throws(
            () => new BogusDomainObject({ name: "i am bogus", bogus: 6 }),
            (error: Error) => error.message.contains("bogus"));
    });

    await test("deserialization tolerates deprecated properties lingering in stored data", () =>
    {
        // simulates an artifact serialized by older code that had a since-removed field
        const stored = {
            $typename: "Test.TestDomainObject",
            id: "foo",
            name: "i am foo",
            deprecatedField: "value from a field that no longer exists in code"
        };

        const deserialized = Deserializer.deserialize<TestDomainObject>(stored);
        assert.ok(deserialized instanceof TestDomainObject);
        assert.strictEqual(deserialized.id, "foo");
        assert.strictEqual(deserialized.name, "i am foo");
        assert.strictEqual((deserialized.serialize() as Record<string, unknown>).deprecatedField, undefined);
    });
});