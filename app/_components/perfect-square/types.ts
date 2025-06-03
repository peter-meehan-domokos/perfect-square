import { Simulation } from "d3-force";
import { Category, DatapointInfo, DatapointCategoryValue } from "@/app/types/data-types";
import { TransformFn } from "@/app/types/function-types";

export type DatasetOrder = "low-to-high" | "high-to-low";

export interface MeasureDataSummaryItem {
    min: number | undefined;
    max: number | undefined;
    range: number | undefined;
    order?: DatasetOrder;
}

export interface DatapointQuadrantValue extends Omit<DatapointCategoryValue, "value"> {
    value: number | undefined;
    rawValue: number | null;
    name: string;
    label: string;
    calcBarHeight: (maxHeight: number) => number;
}

export interface DatapointQuadrantData extends Category {
    values: DatapointQuadrantValue[];
}

export interface DatasetMetadata<T> {
    mean: T | undefined;
    deviation: T | undefined;
    position: T | undefined;
}

export interface DatapointQuadrantsData {
    quadrantsData: DatapointQuadrantData[];
}

export interface DatapointPosition {
    cellX: number;
    cellY: number;
    x?: number;
    y?: number;
}

export interface PerfectSquareDatapoint extends DatapointInfo, DatapointQuadrantsData, DatapointPosition {
    i: number;
    metadata: DatasetMetadata<number>;
}

export interface SimulationDimensions {
    nodeWidth: number;
    nodeHeight: number;
    nrNodes: number;
}

export interface PerfectSquareSimulationNodeDatum extends d3.SimulationNodeDatum, PerfectSquareDatapoint {}

export interface SimulationData {
    key: string;
    nodesData: PerfectSquareSimulationNodeDatum[];
    metadata: DatasetMetadata<MeasureDataSummaryItem>;
}

export interface PerfectSquareForceSimulation extends Simulation<PerfectSquareSimulationNodeDatum, undefined> {}

export type ArrangeByOption = "deviation" | "mean" | "position" | "";

export interface ArrangeBy {
    x: ArrangeByOption;
    y: ArrangeByOption;
    colour: ArrangeByOption;
}

export interface DisplaySettings {
    arrangeBy: ArrangeBy;
} 