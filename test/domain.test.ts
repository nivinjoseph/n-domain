import "@nivinjoseph/n-ext";
import * as Assert from "assert";
import { Todo } from "./domain/todo";
import { DevDomainContext } from "../src";


suite("Domain tests", () =>
{
    test("AggregateRoot", () =>
    {
        const domainContext = new DevDomainContext();

        const original = Todo.create(domainContext, "First", "This is the first.");
        original.updateTitle("First 1");

        Assert.strictEqual(original.hasChanges, true);
        Assert.strictEqual(original.version, 2);
        Assert.strictEqual(original.events.length, 2);
        Assert.strictEqual(original.title, "First 1");
        Assert.strictEqual(original.description, "This is the first.");


        const serialized = original.serialize();
        // console.log(serialized);
        const deserialized = Todo.deserialize(domainContext, serialized);

        Assert.ok(deserialized instanceof Todo);
        Assert.strictEqual((<Object>deserialized).getTypeName(), "Todo");
        Assert.strictEqual(deserialized.id, original.id);
        Assert.strictEqual(deserialized.createdAt, original.createdAt);
        Assert.strictEqual(deserialized.updatedAt, original.updatedAt);
        Assert.strictEqual(deserialized.version, original.version);
        Assert.strictEqual(deserialized.events.length, original.events.length);
        Assert.strictEqual(deserialized.title, original.title);
        Assert.strictEqual(deserialized.description, original.description);

        const reconstructed = deserialized.constructVersion(1);

        Assert.ok(reconstructed instanceof Todo);
        Assert.strictEqual((<Object>reconstructed).getTypeName(), "Todo");
        Assert.strictEqual(reconstructed.id, original.id);
        Assert.strictEqual(reconstructed.createdAt, original.createdAt);
        Assert.strictEqual(reconstructed.version, 1);
        Assert.strictEqual(reconstructed.events.length, 1);
        Assert.strictEqual(reconstructed.title, "First");
        Assert.strictEqual(reconstructed.description, original.description);
    });
});



