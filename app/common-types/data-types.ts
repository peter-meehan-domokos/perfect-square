import { TransformFn } from "./function-types";
import { Simulation } from "d3-force";

export interface QueryResult <T> {
    data : T | null,
    error : Error | null,
    loading : boolean
}

//examples
export interface Example {
    key : string;
    name : string
}

export interface Examples extends Array<Example>{};

//data for an example
interface ExampleInfo {
    label : string,
    name : string
}


//ITEMS FOR DATAPOINTS
//items for a standard datapoint, that is not formatted for any particular vis
type OptimalValue = "min" | "max" | number;
interface Category {
    key : string,
    title : string,
    i : number
}
/*
interface Categories {
}
const cats : Category[] = [
    { key: "c1", title : "C1", i : 0 },
    { key: "c2", title : "C2", i : 1 }
]
*/

//interface Measure <T> {
interface Measure {
    key : string,
    name : string,
    label : string,
    //@todo - need to work out how to get the cats in here..define teh Category keys
    //as being one of the actual catoegories I htink, then pass in 
    categoryKey : string, // keyof T,
    range : [number, number],
    optimalValue : OptimalValue,
    preInjuryValue : number
}

//interface MeasureImpl = Measure<Categories> ??????????
interface DatapointCategoryValue {
    key : string,
    measureKey : string,
    value : number | null
}

interface DatapointCategoryData {
    key : string, //@todo - make it only from category keys
    title : string, 
    values : DatapointCategoryValue[]
}

//corresponding items formatted for the perfect square datapoint (eg categories become quadrants)
type DatasetOrder = "low-to-high" | "high-to-low";
export interface MeasureDataSummaryItem {
    min : number | undefined,
    max : number | undefined,
    range : number | undefined,
    order? : DatasetOrder
}

export interface DatapointQuadrantValue extends DatapointCategoryValue {
    rawValue : number | null,
    name : string, //@todo - why are we changing from title to name, remove this
    label : string,
    calcBarHeight : (maxHeight : number) => number
}

export interface DatapointQuadrantData extends Category {
    values : DatapointQuadrantValue[]
}

export interface DatasetMetadata<T> {
    mean : T | undefined,
    deviation : T | undefined,
    position : T | undefined,
}

//DATAPOINT SUPERCLASSES
//basic metadata info that any datapoint needs
export interface DatapointInfo {
    key : string,
    title : string,
    date? : Date
}

//the data for each category for a given datapoint
interface DatapointCategoriesData {
    categoriesData : DatapointCategoryData[];
}

//the data for each quadrant (ie category) of a perfectSquare datapoint, formatted for the perfectSquare vis
interface DatapointQuadrantsData {
    quadrantsData: DatapointQuadrantData[]
}

//@todo - need an interface that has at least one of cellX/Y or x/y
//maybe have them as two types and some kind of union, or change the overall implementation so it lways just has .x and .y
//atm, cellX and Y re requiree because x/y come from these 
interface DatapointPosition {
    cellX : number,
    cellY : number,
    x? : number,
    y? : number
}

//DATAPOINT
//a standard datapoint, before it has been formatted for any particular vis
export interface Datapoint extends DatapointInfo, DatapointCategoriesData {};

// a standard datapoint that also has positional information for a cell (required) and coordinate grid
export interface PositionedDatapoint extends Datapoint, DatapointPosition {}

//a datapoint in the format that the perfectSquareLayout expects 
//(not a subclass of Datapoint as it is a reformatting rather than an extension eg categories become quadrants)
export interface PerfectSquareDatapoint extends DatapointInfo, DatapointQuadrantsData, DatapointPosition {
    i : number,
    metadata : DatasetMetadata<number>
}

//DATA (including all datapoints)
//standard data, before it has been formatted for any particular vis
interface DataSupportingProperties {
    key : string,
    title : string[],
    desc? : string[],
    info : ExampleInfo,
    measures : Measure[],
    categories : Category[],
}

export interface ExampleData extends DataSupportingProperties {
    datapoints : Datapoint[]
}
//datapoints in the format that the perfect square expects, along with summary metadata
export interface PerfectSquareData extends DataSupportingProperties {
    datapoints: PerfectSquareDatapoint[],
    metadata : DatasetMetadata<MeasureDataSummaryItem>
} 

export interface Margin {
    left : number,
    right : number,
    top : number,
    bottom : number,
}

export interface BasicContainer {
    width : number,
    height : number,
}

//make the optional properties required
export interface Container extends BasicContainer {
    margin : Margin,
    contentsWidth : number,
    contentsHeight : number
}

export interface GridStructure {
    nrCols : number,
    nrRows : number,
    nrCells : number
}

export interface CellDimensions {
    cellWidth : number,
    cellHeight : number,
    cellMargin : Margin,
}

export interface GridUtilityFunctions {
    _cellX : TransformFn<number>,
    _cellY : TransformFn<number>,
    _rowNr : TransformFn<number>,
    _colNr : TransformFn<number>
}

export interface Grid extends GridStructure, CellDimensions, GridUtilityFunctions { };

//@todo - handle undefined differently - see chartContainer
export interface ContainerWithDatapointPositioning extends Container {
    _x : (d : PositionedDatapoint) => number,
    _y : (d : PositionedDatapoint) => number,
}

export interface SimulationDimensions {
    nodeWidth : number,
    nodeHeight : number,
    nrNodes : number
}

export interface PerfectSquareSimulationNodeDatum extends d3.SimulationNodeDatum, PerfectSquareDatapoint {}

export interface SimulationData {
    nodesData : PerfectSquareSimulationNodeDatum[],
    metadata : DatasetMetadata<MeasureDataSummaryItem>
}

export interface PerfectSquareForceSimulation extends Simulation<PerfectSquareSimulationNodeDatum, undefined>{}

export interface Tooltip {
    //tagged union
    type: "header" | "loading" | "select-measure",
    position : "top" | "top-right" | "bottom",
    title? : string,
    subtitle? : string,
    paragraphs? : [
        { 
            title?: string,
            text: string 
        }
    ],
    styles? : {
        bg : {
            fill : string
        },
        textLine : {
            fontSize : number,
            fontMin : number,
            fontMax : number
        }
    }

}

export interface Transition {
    delay?: number,
    duration?: number
}

//@todo import from constants/config
//@todo exclude invalid states eg where both x and y have same value
//todo this, take a similar approach to fetch funnction that cannot have more than one of
//data, loading or error set to non-null (see 83 ways book, item 29)
type ArrangeByOption = "deviation" | "mean" | "position" | ""; 

export interface ArrangeBy {
    x: ArrangeByOption,
    y : ArrangeByOption,
    colour : ArrangeByOption
}

export interface DisplaySettings {
    arrangeBy: ArrangeBy
}