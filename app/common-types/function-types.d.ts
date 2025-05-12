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

export interface TransformFn<T, U> {
    (args : T):U;
}

export interface SecondOrderTransformFn<T, U> {
    (t : T):TransformFn<T, U>;
}

/*
export interface TransformFnWithOptions<T,U> {
    (t : T, u : U): T
}
*/

export type TransformerFactory<T, U, Options> = (
    targetValue : T, 
    options : Options
) => TransformFn<T, U>

export interface AccessorFn<T , R> {
    (t : T):R
}

export interface TransformWithAccessorFn<T, Value> {
    (t : T, accessor : AccessorFn<T, Value>):T;
}

export interface ConvertToPercentageOptions {
    dps? : number,
    defaultValue? : number,
    customRange? : [number, number],
    allowGreaterThan100? : boolean,
    allowLessThanZero? : boolean,
    useRangeAsBound? : boolean
}

export interface ZoomCallbacks {
    onStart? : HandlerFn<D3ZoomEvent<SVGElement, PositionedDatapoint>> | undefined,
    onZoom? : HandlerFn<D3ZoomEvent<SVGSVGElement, PositionedDatapoint>> | undefined,
    onEnd? : HandlerFn<D3ZoomEvent<SVGSVGElement, PositionedDatapoint>> | undefined,
}
