import { ZoomTransform, D3ZoomEvent } from "d3-zoom";
import { ReactElement } from "react";
import { QueryResult, PositionedDatapoint } from "./data-types";

export interface Noop {
    (): void;
}

export interface HandlerFnWithNoArgs {
    (): void;
}
export interface HandlerFn<T> {
    (arg: T): void;
}

export interface HandlerFnWith2Args<T, U> {
    (arg: T): void;
    (arg: U): void;
}

/*
export interface HandlerFn<T, U, V> {
    (arg1 : T, arg2 : U, arg3 : V): void;
}*/

//export type Handler1<T> = (argObj: T) => void;

//@todo - use interface instead
export type QueryResultHandlerFn<T> = HandlerFn<QueryResult<T>>
/*
export interface QueryResultHandlerFn<T> {
    HandlerFn<QueryResult<T>>
}
*/

//@todo - use reacts own type for this
export interface FunctionalComponentWithNoProps {
    (): ReactElement;
}

export interface TransformFn<T> {
    (args : T):T;
}

export interface SecondOrderTransformFn<T> {
    (t : T):TransformFn<T>;
}

export interface AccessorFn<T , Value> {
    (t : T):Value
}

export interface TransformWithAccessorFn<T, Value> {
    (t : T, accessor : AccessorFn<T, Value>):T;
}
  
export interface ArrayManipulatorFn<T> {
(arr: T[]):T[]
}

export interface ArrayManipulatorWithAccessorFn<T, Value> {
    (arr: T[], accessor : AccessorFn<T, Value>):T[]
    }

export interface ZoomCallbacks {
    onZoomStart? : HandlerFn<D3ZoomEvent<SVGElement, PositionedDatapoint>> | undefined,
    onZoom? : HandlerFn<D3ZoomEvent<SVGSVGElement, PositionedDatapoint>> | undefined,
    onZoomEnd? : HandlerFn<D3ZoomEvent<SVGSVGElement, PositionedDatapoint>> | undefined,
}
