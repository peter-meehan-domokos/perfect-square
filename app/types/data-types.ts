export interface QueryResult<T> {
    data: T | null;
    error: Error | null;
    loading: boolean;
}

export interface Example {
    key: string;
    name: string;
}

export interface Examples extends Array<Example> {}

interface ExampleInfo {
    label: string;
    name: string;
}

type OptimalValue = "min" | "max" | number;

export interface Category {
    key: string;
    title: string;
    i: number;
}

export interface Measure {
    key: string;
    name: string;
    label: string;
    categoryKey: string;
    range: [number, number];
    optimalValue: OptimalValue;
    preInjuryValue: number;
}

export interface DatapointCategoryValue {
    key: string;
    measureKey: string;
    value: number | null;
}

export interface DatapointCategoryData {
    key: string;
    title: string;
    values: DatapointCategoryValue[];
}

export interface DatapointInfo {
    key: string;
    title: string;
    date?: Date;
}

interface DatapointCategoriesData {
    categoriesData: DatapointCategoryData[];
}

export interface Datapoint extends DatapointInfo, DatapointCategoriesData {}

export interface PositionedDatapoint extends Datapoint {
    cellX: number;
    cellY: number;
    x?: number;
    y?: number;
}

export interface DataSupportingProperties {
    key: string;
    title: string[];
    desc?: string[];
    info: ExampleInfo;
    measures: Measure[];
    categories: Category[];
}

export interface ExampleData extends DataSupportingProperties {
    datapoints: Datapoint[];
}

export type LiberalNumber = number | null | undefined | string; 