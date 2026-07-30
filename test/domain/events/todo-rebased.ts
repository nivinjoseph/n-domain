import { serialize } from "@nivinjoseph/n-util";
import { RebaseEvent } from "../../../src/index.js";
import { TodoState } from "../todo-state.js";


// framework-owned rebase mechanics: this class contributes only its identity (the @serialize name
// binding for stored events) and refType — the baseline payload is produced and applied by the framework.
@serialize("Test")
export class TodoRebased extends RebaseEvent<TodoState>
{
    public get refType(): string { return "Todo"; }
}
