export const SETTINGS_OPTIONS = {
    arrangeBy:[
        { 
            key:"value", label:"Mean Avg", 
            desc:[
                { text:"Each chart is a datapoint (vector) made up of multiple bars (measures or dimensions)." },
                { text:"The mean of the entire datapoint is the avg score for all the bars" }
            ] 
        },
        { 
            key:"deviation", label:"Deviation", 
            desc:"",
            desc:[
                { text:"Each chart is a datapoint (vector) made up of multiple bars (measures or dimensions)." },
                { text:"The standard deviation of the datapoint is the deviation of the values of all the bars" }
            ] 
        },
        { 
            key:"position", label:"Date", 
            desc:[
                { title:"What it is", text:"This arranges the charts (datapoints) in order of the date associaated with them." },
                { title:"How it works", text:"If there are no dates, then it arranegs tehm based on the order that they are stored in" }
            ] 
        }
        /*{ key:"similarity", label:"Similarity", disabled:true, desc:"" }*/
    ]
}

export const DEFAULT_SETTINGS = { 
    arrangeBy:{ x: "", y:"", colour:"" }
}

export const ARRANGEMENT_OPTIONS = [
    { key:"x", label:"x-axis" },
    { key:"y", label:"y-axis" },
    { key:"colour", label:"blue scale" }
]