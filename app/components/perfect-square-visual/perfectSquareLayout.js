import * as d3 from 'd3';
import { sortAscending, sortDescending } from '../../helpers/ArrayHelpers';
import { percentageScoreConverter } from '../../helpers/dataHelpers';

/**
 * @description converts the data it receives into the format expected by the perfectSquareComponent (d3 layout pattern),
 * for example adding grid positions of the datapoints, and percentage values for each measure
 *
 * @param {object} data an object containing an array of datapoints, the measures to be displayed, and various metadata
 * @param {object} settings contains teh number of columns, and chart dimensions, needed to determine positions
 * 
 * @returns {object} the processed data object, in the format that the perfectSquareComponent can interpret
 */
 function perfectSquareLayout(data, settings={}){
    if(!data || !settings.grid || !data.datapoints) { return data; }
    const { measures, datapoints } = data;
    const { grid:{ _cellX, _cellY, _rowNr, _colNr } } = settings;

    const datapointsWithOrderedMeasures = datapoints.map((datapoint,i) => {
        return {
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
            cellX: _cellX(_colNr(i)),
            cellY: _cellY(_rowNr(i))
        }
    })

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
            info:datapointsOrderedBySummaryMean.find(datapoint => datapoint.key === d.key).info,
            isOnScreen:true
        }))
        .map(d => ({ 
            ...d, 
            subtitle: `Mean ${d.info.mean} / Deviation ${d.info.deviation}`
            //subtitle: `Position ${d.info.position} / ${datapoints.length}`
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