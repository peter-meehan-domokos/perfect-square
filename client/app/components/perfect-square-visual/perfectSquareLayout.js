import * as d3 from 'd3';
import { sortAscending, sortDescending } from '../../helpers/ArrayHelpers';
import { percentageScoreConverter } from '../../helpers/dataHelpers';

//note i starts at 0, as does rowNr and colNr
const calcRowNr = (i, nrCols) => Math.floor(i / nrCols);
const calcColNr = (i, nrCols) => i % nrCols;

/*
    @todo rewrite as a proper d3 layout function instead of using settings as a parameter
*/
export default function(data, settings={}){
    const { measures, datapoints } = data;
    const { nrCols } = settings;
    const datapointsWithOrderedMeasures = datapoints.map((datapoint,i) => ({
        key:datapoint.key,
        title:datapoint.title,
        quadrantsData:datapoint.categoriesData.map((categoryData, j) => {
            const unorderedValues = categoryData
                .values
                .map(v => {
                    const measure = measures.find(m => m.key === v.measureKey);
                    const { preInjuryValue, range, name, label } = measure;
                    const convertToPC = percentageScoreConverter(preInjuryValue, { range, useRangeAsBound:true });
                    const value = convertToPC(v.value);
                    return {
                        ...v,
                        rawValue:v.value,
                        value,
                        name,
                        label,
                        calcBarHeight:maxHeight => (value/100) * maxHeight
                    }
                });

            const orderedValues = j === 0 || j === 2 ? sortAscending(unorderedValues, v => v.value) : sortDescending(unorderedValues, v => v.value);

            return {
                key:`quad-${j+1}`,
                i:j,
                ...categoryData,
                values: orderedValues
            }
        }),
        i,
        rowNr:calcRowNr(i, nrCols),
        colNr:calcColNr(i, nrCols)
    }));

    const datapointsWithSummaryValues = datapointsWithOrderedMeasures.map(datapoint => {
        //@todo - user rollup
        const quadrantsWithSummaryValues = datapoint.quadrantsData.map(q => ({
            ...q,
            value:Math.round(d3.mean(q.values.map(v => v.value)))
        }))
        const datapointValue = d3.mean(quadrantsWithSummaryValues.map(q => q.value));
        const allValues = datapoint.quadrantsData
            .map(q => q.values)
            .reduce((arr1, arr2) => ([...arr1, ...arr2]))
            .map(v => v.value);

        const datapointDeviation = d3.deviation(allValues)
        return {
            ...datapoint,
            quadrantsData:quadrantsWithSummaryValues,
            info:{
                value:Math.round(datapointValue),
                deviation:Number(datapointDeviation.toFixed(1))
            }
        }
    });

    const minValue = d3.min(datapointsWithSummaryValues.map(d => d.info.value));
    const maxValue = d3.max(datapointsWithSummaryValues.map(d => d.info.value));
    const valueRange = maxValue - minValue;


    const minDeviation = d3.min(datapointsWithSummaryValues.map(d => d.info.deviation));
    const maxDeviation = d3.max(datapointsWithSummaryValues.map(d => d.info.deviation));
    const deviationRange = maxDeviation - minDeviation;

    //add position to info
    const datapointsOrderedBySummaryValue = sortAscending(datapointsWithSummaryValues, v => v.info.value)
        .map((d,i) => ({ ...d, info:{ ...d.info, position:i + 1 } }));
    
    //update the info object in the ordered datapoints that we will actaully return
    const datapointsWithSummaryValuesAndPosition = datapointsWithSummaryValues.map(d => ({ 
        ...d, 
        info:datapointsOrderedBySummaryValue.find(datapoint => datapoint.key === d.key).info
    }));

    return {
        measures, 
        datapoints: datapointsWithSummaryValuesAndPosition,
        info:{
            value:{ min:minValue, max:maxValue, range:valueRange, order:"low-to-high" },
            deviation:{ min:minDeviation, max: maxDeviation, range:deviationRange, order:"high-to-low" },
            //date - this will be position if there are dates
            position:{ min: 0, max: datapoints.length, range:datapoints.length, order:"low-to-high" },
        }
    }
}