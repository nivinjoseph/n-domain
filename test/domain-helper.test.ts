import * as Assert from "assert";
import { DomainHelper } from "../src";
import "@nivinjoseph/n-ext";
import { Delay } from "@nivinjoseph/n-util";
import * as Fs from "fs";
import * as Path from "path";


suite("DomainHelper tests", () =>
{
    test("now", () =>
    {
        const now = DomainHelper.now;

        Assert.ok(typeof now === "number");
        Assert.ok(now > 0);
        // Assert.ok(now > Date.now());
        console.log("now", now);
    });


    test("generateId", () =>
    {
        const id = DomainHelper.generateId("usr");
        Assert.ok(!id.contains(" "));
        Assert.ok(!id.contains("-"));
        Assert.ok(id.startsWith("usr_"));
        Assert.strictEqual(id.length, 36);
        console.log("id", id);
        console.log("max number length", Number.MAX_SAFE_INTEGER.toString().length);
    });
    
    test("monotonic id", async () =>
    {
        const pastIdsFilePath = Path.join(__dirname, "past-ids.json");
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
        
        Assert.ok(combinedIds.equals(combinedIds.orderBy()));
        Assert.ok(isOrdered);
    });
});