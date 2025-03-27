export const LEVELS_OF_DETAIL = [1,2,3];
//these values base_sizes (derived from the chart width and height essentially)
export const LEVELS_OF_DETAIL_THRESHOLDS = [90, 220]; //note - level 2 below 90 has poor performance as too many charts

export const SETTINGS_OPTIONS = {
    arrangeBy:[
        { 
            key:"mean", label:"Mean Avg", 
            desc:[
                { text:"Each chart is a datapoint (vector) made up of multiple bars (measures or dimensions)." },
                { text:"The datapoint's mean average is the mean average of all it bar values." }
            ] 
        },
        { 
            key:"deviation", label:"Deviation", 
            desc:"",
            desc:[
                { text:"Each chart is a datapoint (vector) made up of multiple bars (measures or dimensions)." },
                { text:"The datapoint's standard deviation is the standard deviation of all it bar values." }
            ] 
        },
        { 
            key:"position", label:"Date", 
            desc:[
                { title:"What it is", text:"This arranges the charts (datapoints) in order of the date associaated with them." },
                { title:"How it works", text:"If there are no dates, then it arranges them based on the order that they are stored in." }
            ] 
        }
        /*{ key:"similarity", label:"Similarity", disabled:true, desc:"" }*/
    ]
}

export const SELECT_MEASURE_TOOLTIP = {
    area:"charts-viewbox",
    paragraphs:[
        { text: "Clicking a measure isn't available yet." }
    ],
    fixedInPlace:false 
}

export const DEFAULT_SETTINGS = { 
    arrangeBy:{ x: "", y:"", colour:"" }
}

export const ARRANGEMENT_OPTIONS = [
    { key:"x", label:"x-axis" },
    { key:"y", label:"y-axis" },
    { key:"colour", label:"blue scale" }
]