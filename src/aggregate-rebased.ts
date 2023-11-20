// import { given } from "@nivinjoseph/n-defensive";
// import { ClassHierarchy, serialize } from "@nivinjoseph/n-util";
// import { AggregateState } from "./aggregate-state";
// import { AggregateStateHelper } from "./aggregate-state-helper";
// import { DomainEvent } from "./domain-event";
// import { DomainEventData } from "./domain-event-data";


// export abstract class AggregateRebased<T extends AggregateState> extends DomainEvent<T>
// {
//     private readonly _defaultState: object;
//     private readonly _rebaseState: object;
//     private readonly _rebaseVersion: number;
    
    
//     @serialize
//     public get defaultState(): object { return this._defaultState; }
    
//     @serialize
//     public get rebaseState(): object { return this._rebaseState; }
    
//     @serialize
//     public get rebaseVersion(): number { return this._rebaseVersion; }
    
    
    
//     public constructor(data: AggregateRebasedEventData)
//     {
//         super(data);
        
//         const { defaultState, rebaseState, rebaseVersion } = data;
        
//         given(defaultState, "defaultState").ensureHasValue().ensureIsObject();
//         this._defaultState = defaultState;
        
//         given(rebaseState, "rebaseState").ensureHasValue().ensureIsObject();
//         this._rebaseState = rebaseState;
        
//         given(rebaseVersion, "rebaseVersion").ensureHasValue().ensureIsNumber()
//             .ensure(t => t > 0);
//         this._rebaseVersion = rebaseVersion;
//     }
    
    
//     protected applyEvent(state: T): void
//     {
//         AggregateStateHelper.rebaseState(
//             state,
//             this._defaultState,
//             this._rebaseState,
//             this._rebaseVersion
//         );
//     }
// }

// export type AggregateRebasedEventData = DomainEventData
//     & Pick<AggregateRebased<any>, "defaultState" | "rebaseState" | "rebaseVersion">;
    
// // export interface AggregateRebasedInterface
// // {
// //     get defaultState(): object;
// //     get rebaseState(): object;
// //     get rebaseVersion(): number;
// // }
    
// // export function AggregateRebasedMixin<TEventClass extends ClassDefinition<DomainEvent<U> & AggregateRebasedInterface>, U extends AggregateState>(AggregateRebasedEventClass: TEventClass)
// // {
// //     return class extends AggregateRebasedEventClass
// //     {
// //         protected applyEvent(state: U): void
// //         {
// //             AggregateStateHelper.rebaseState(
// //                 state,
// //                 this.defaultState,
// //                 this.rebaseState,
// //                 this.rebaseVersion
// //             );
// //         }
// //     };
// // }
