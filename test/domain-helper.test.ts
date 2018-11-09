import * as Assert from "assert";
import { DomainHelper } from "../src";
import "@nivinjoseph/n-ext";


suite("DomainHelper tests", () =>
{
    test("now", () =>
    {
        const now = DomainHelper.now;

        Assert.ok(typeof (now) === "number");
        Assert.ok(now > 0);
        // Assert.ok(now > Date.now());
        console.log("now", now);
    });


    test("generateId", () =>
    {
        const id = DomainHelper.generateId();

        Assert.ok(!id.contains(" "));
        Assert.ok(!id.contains("-"));
        Assert.strictEqual(id.length, 32);
        console.log("id", id);
    });
});