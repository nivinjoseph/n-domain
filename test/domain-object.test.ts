import * as Assert from "assert";
import { TestDomainObject } from "./domain/test-domain-object";


suite("DomainObject tests", () =>
{
    test("equality check", () =>
    {
        const foo = new TestDomainObject("foo", "i am foo");
        const bar = new TestDomainObject("bar", "i am foo");
        const baz = new TestDomainObject("bar", "i am foo");
        
        Assert.ok(foo.equals(foo));
        Assert.ok(!foo.equals(bar));
        Assert.ok(bar.equals(baz));
    });
});