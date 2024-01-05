import { DomainEvent } from "../../../src/index.js";
import { TodoState } from "../todo-state.js";


export abstract class TodoDomainEvent extends DomainEvent<TodoState>
{
    // public get refType(): string { return Todo.getTypeName(); }
    // THIS CANNOT IMPORT THE TODO CLASS, THIS IS CAUSE A CIRCULAR DEPENDENCY, WHICH WILL BLOW UP IN RUNTIME!!
    // ALWAYS USE A STRING HERE!!!!!
    public get refType(): string { return "Todo"; }
}