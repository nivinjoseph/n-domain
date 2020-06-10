import { DomainContext } from "../src/domain-context";
import { Todo } from "./domain/todo";
import * as Assert from "assert";


suite("Domain Builtin test", () =>
{
    const domainContext: DomainContext = { userId: "dev" };
    
    test("Built in sanity check", () =>
    {
        const todo = Todo.create(domainContext, "title", "description");
        todo.updateTitle("My title");
        todo.updateDescription("My description");
        todo.markAsCompleted();

        todo.test();

        Assert.ok(true);
    });
});