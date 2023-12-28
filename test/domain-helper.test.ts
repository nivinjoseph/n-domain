import "@nivinjoseph/n-ext";
import { Delay } from "@nivinjoseph/n-util";
import assert from "node:assert";
import Fs from "node:fs";
import { describe, test } from "node:test";
import { URL } from "node:url";
import { DomainHelper } from "../src/index.js";


await describe("DomainHelper tests", async () =>
{
    await test("now", () =>
    {
        const now = DomainHelper.now;

        assert.ok(typeof now === "number");
        assert.ok(now > 0);
        // assert.ok(now > Date.now());
        console.log("now", now);
    });


    await test("generateId", () =>
    {
        const id = DomainHelper.generateId("usr");
        assert.ok(!id.contains(" "));
        assert.ok(!id.contains("-"));
        assert.ok(id.startsWith("usr_"));
        assert.strictEqual(id.length, 36);
        console.log("id", id);
        console.log("max number length", Number.MAX_SAFE_INTEGER.toString().length);
    });

    await test("monotonic id", async () =>
    {
        // const pastIdsFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "past-ids.json");
        const pastIdsFilePath = new URL("./past-ids.json", import.meta.url);
        let pastIds = new Array<string>();
        if (Fs.existsSync(pastIdsFilePath))
            pastIds = JSON.parse(Fs.readFileSync(pastIdsFilePath, "utf-8"));

        const ids = new Array<string>();

        for (let i = 0; i < 100; i++)
        {
            ids.push(DomainHelper.generateId("tst"));

            if (i % 10 === 0)
                await Delay.seconds(1);
        }

        const combinedIds = [...pastIds, ...ids];

        const ordered = combinedIds.orderBy();
        let isOrdered = true;
        for (let i = 0; i < combinedIds.length; i++)
        {
            if (combinedIds[i] !== ordered[i])
                isOrdered = false;
        }

        Fs.writeFileSync(pastIdsFilePath, JSON.stringify(ids), "utf-8");

        assert.ok(combinedIds.equals(combinedIds.orderBy()));
        assert.ok(isOrdered);
    });
});