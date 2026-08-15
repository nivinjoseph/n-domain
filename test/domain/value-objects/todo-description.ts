import { given } from "@nivinjoseph/n-defensive";
import { serialize } from "@nivinjoseph/n-util";
import { DomainObject, DomainObjectData } from "../../../src/index.js";


@serialize("Test")
export class TodoDescription extends DomainObject<TodoDescription, "description" | "descriptionSummary">
{
    private readonly _description: string;
    private readonly _descriptionSummary: string;


    @serialize
    public get description(): string { return this._description; }

    @serialize
    public get descriptionSummary(): string { return this._descriptionSummary; }


    public constructor(data: DomainObjectData<TodoDescription>)
    {
        super(data);

        const { description, descriptionSummary } = data;

        given(description, "description").ensureHasValue().ensureIsString();
        this._description = description;

        given(descriptionSummary, "descriptionSummary").ensureHasValue().ensureIsString();
        this._descriptionSummary = descriptionSummary;
    }

    public static create(value: string): TodoDescription
    {
        given(value, "value").ensureHasValue().ensureIsString();

        return new TodoDescription({
            description: value,
            descriptionSummary: value.split(" ").take(2).join(" ")
        });
    }
}