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

export interface QueryResultHandlerFn<T> extends HandlerFn<QueryResult<T>> {}

export interface FunctionalComponentWithNoProps {
    (): ReactElement;
}

export interface TransformFn<T, U> {
    (args: T): U;
}

export interface SecondOrderTransformFn<T, U> {
    (t: T): TransformFn<T, U>;
}

export interface TransformerFactory<T, U, Options> {
    (targetValue: T, options: Options): TransformFn<T, U>;
}

export interface AccessorFn<T, R> {
    (t: T): R;
}

export interface TransformWithAccessorFn<T, Value> {
    (t: T, accessor: AccessorFn<T, Value>): T;
}

export interface ConvertToPercentageOptions {
    dps?: number;
    defaultValue?: number;
    customRange?: [number, number];
    allowGreaterThan100?: boolean;
    allowLessThanZero?: boolean;
    useRangeAsBound?: boolean;
}

export interface ZoomCallbacks {
    onStart?: HandlerFn<D3ZoomEvent<SVGElement, PositionedDatapoint>> | undefined;
    onZoom?: HandlerFn<D3ZoomEvent<SVGElement, PositionedDatapoint>> | undefined;
    onEnd?: HandlerFn<D3ZoomEvent<SVGElement, PositionedDatapoint>> | undefined;
} 