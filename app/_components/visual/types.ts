import { TransformFn } from "@/app/types/function-types";
import { PositionedDatapoint } from "@/app/types/data-types";

export interface Margin {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface BasicContainer {
    width: number;
    height: number;
}

export interface Container extends BasicContainer {
    margin: Margin;
    contentsWidth: number;
    contentsHeight: number;
}

export interface GridStructure {
    nrCols: number;
    nrRows: number;
    nrCells: number;
}

export interface CellDimensions {
    cellWidth: number;
    cellHeight: number;
    cellMargin: Margin;
}

export interface GridUtilityFunctions {
    _cellX: TransformFn<number, number>;
    _cellY: TransformFn<number, number>;
    _rowNr: TransformFn<number, number>;
    _colNr: TransformFn<number, number>;
}

export interface Grid extends GridStructure, CellDimensions, GridUtilityFunctions {}

export interface ContainerWithDatapointPositioning extends Container {
    _x: (d: PositionedDatapoint) => number;
    _y: (d: PositionedDatapoint) => number;
}

export interface Tooltip {
    type: "header" | "loading" | "select-measure";
    position: "top" | "top-right" | "bottom";
    title?: string;
    subtitle?: string;
    paragraphs?: [
        {
            title?: string;
            text: string;
        }
    ];
    styles?: {
        bg: {
            fill: string;
        };
        textLine: {
            fontSize: number;
            fontMin: number;
            fontMax: number;
        };
    };
}

export interface Transition {
    delay?: number;
    duration?: number;
}

export type LevelOfDetail = 1 | 2 | 3; 