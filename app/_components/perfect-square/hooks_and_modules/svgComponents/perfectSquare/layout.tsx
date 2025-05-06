import { ExampleData, PerfectSquareData, Grid, DatapointQuadrantValue, PerfectSquareDatapoint, DatapointQuadrantData, GridUtilityFunctions } from '@/app/common-types/data-types';
import { TransformFn, SecondOrderTransformFn } from '@/app/common-types/function-types';
import * as d3 from 'd3';
import { sortAscending, sortDescending } from '../../../../../_helpers/arrayHelpers';
import { percentageScoreConverter } from '../../../../../_helpers/dataHelpers';

/**
 * @description converts the data it receives into the format expected by the perfectSquareComponent (d3 layout pattern),
 * for example adding grid positions of the datapoints, and percentage values for each measure
 *
 * @param {object} data an object containing an array of datapoints, the measures to be displayed, and various metadata
 * @param {object} grid contains the number of columns, and chart dimensions, needed to determine positions
 * 
 * @returns {object} the processed data object, in the format that the perfectSquareComponent can interpret
 */
 function perfectSquareLayout(data : ExampleData, grid : Grid): PerfectSquareData {
    const { measures, datapoints } = data;

    const { _cellX, _cellY, _rowNr, _colNr } = grid;

    const datapointsWithOrderedMeasures : PerfectSquareDatapoint[] = datapoints.map((datapoint,i) => {

        const quadrantsData : DatapointQuadrantData[] = datapoint.categoriesData.map((categoryData, j) => {
            const { key, title, values } = categoryData;
            const unorderedValues : DatapointQuadrantValue[] = values
                //it is possible that a measure isn't available for all of the values,
                //as that depends on how consumers of perfectSquare have been configured.
                //this can even vary per datapoint, so perfectSquare will make no assumptions
                //about the number of values per category on each datapoint
                .filter(v => !!measures.find(m => m.key === v.measureKey))
                .map(v => {
                    //can assert measure exists due to first filter above
                    const measure = measures.find(m => m.key === v.measureKey)!;
                    const { preInjuryValue, range, name="", label="" } = measure;
                    //can also assert non-null value due to second filter above
                    const convertToPC : TransformFn<number> = percentageScoreConverter(preInjuryValue, { range, useRangeAsBound:true });
                    const value = v.value ? convertToPC(v.value) : null;
                    return {
                        ...v,
                        rawValue:v.value,
                        value,
                        name,
                        label,
                        // if null data value, set height to 0, and perfectSquare can add a null indicator instead
                        // note, this will only arise of the measure exists for this value ie the consumer wants
                        // the value to be displayed as part of the quadrant
                        calcBarHeight:maxHeight => value ? (value/100) * maxHeight : 0
                    }
                });

            //@todo - when we improve the typing of the arrayHelpers, we can remove the type declaration here
            const orderedValues : DatapointQuadrantValue[] = j === 0 || j === 2 ? sortAscending(unorderedValues, v => v.value) : sortDescending(unorderedValues, v => v.value);

            return {
                key,//`quad-${j+1}`, 
                i:j,
                title,
                values: orderedValues
            }
        });

        const cellX = _cellX(_colNr(i));
        const cellY = _cellY(_rowNr(i));

        return {
            //DatapointInfo type
            key:datapoint.key,
            title:datapoint.title,
            //DatapointQuadrantsData type
            quadrantsData,
            //DatapointPosition type
            cellX,
            cellY,
            //other properties of the PerfectSquareDatapoint type
            i
        }
    })

    //@todo - must handle undefined cases, as no values are guaranteed to be non-null, so mean etc could return undefined
    //note that the consumer has control over whether or not to pass null values to the perfectSquare component or not
    //which will depend on the use case - do we want null values reported in the vis somehow, or not
    const datapointsWithSummaryInfo = datapointsWithOrderedMeasures.map(datapoint => {
        //@todo - user rollup
        const quadrantsWithSummaryInfo = datapoint.quadrantsData.map(q => ({
            ...q,
            info: { mean:Math.round(d3.mean(q.values.map(v => v.value))) }
        }))
        const datapointMean = d3.mean(quadrantsWithSummaryInfo.map(q => q.info.mean));
        const allValues = datapoint.quadrantsData
            .map(q => q.values)
            .reduce((arr1, arr2) => ([...arr1, ...arr2]))
            .map(v => v.value);

        const datapointDeviation = d3.deviation(allValues)
        return {
            ...datapoint,
            quadrantsData:quadrantsWithSummaryInfo,
            info:{
                mean:Math.round(datapointMean),
                deviation:Number(datapointDeviation.toFixed(1))
            }
        }
    });

    const minMean = d3.min(datapointsWithSummaryInfo.map(d => d.info.mean));
    const maxMean = d3.max(datapointsWithSummaryInfo.map(d => d.info.mean));
    const meanRange = maxMean - minMean;


    const minDeviation = d3.min(datapointsWithSummaryInfo.map(d => d.info.deviation));
    const maxDeviation = d3.max(datapointsWithSummaryInfo.map(d => d.info.deviation));
    const deviationRange = maxDeviation - minDeviation;

    //add position to info
    const datapointsOrderedBySummaryMean = sortAscending(datapointsWithSummaryInfo, v => v.info.mean)
        .map((d,i) => ({ ...d, info:{ ...d.info, position:i + 1 } }));
    
    //update the info object in the ordered datapoints that we will actaully return
    const datapointsWithSummaryInfoAndPosition = datapointsWithSummaryInfo
        .map(d => ({ 
            ...d, 
            info:datapointsOrderedBySummaryMean.find(datapoint => datapoint.key === d.key).info
        }))
        .map(d => ({ 
            ...d, 
            subtitle: `Mean ${d.info.mean} / Deviation ${d.info.deviation}`
        }))

    return {
        ...data,
        measures, 
        datapoints: datapointsWithSummaryInfoAndPosition,
        info:{
            ...data.info,
            mean:{ min:minMean, max:maxMean, range:meanRange, order:"low-to-high" },
            deviation:{ min:minDeviation, max: maxDeviation, range:deviationRange, order:"high-to-low" },
            //position will be used as a default date arrangement if there are dates
            position:{ min: 0, max: datapoints.length, range:datapoints.length, order:"low-to-high" },
        }
    }
}

export default perfectSquareLayout;