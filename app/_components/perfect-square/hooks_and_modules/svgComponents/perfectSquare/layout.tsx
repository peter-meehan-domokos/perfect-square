import { ExampleData, PerfectSquareData, Grid, DatapointQuadrantValue, 
    PerfectSquareDatapoint, DatapointQuadrantData, 
    DatasetMetadata, MeasureDataSummaryItem
} from '@/app/common-types/data-types';
import { TransformFn, SecondOrderTransformFn } from '@/app/common-types/function-types';
import * as d3 from 'd3';
import { sortAscending, sortDescending } from '../../../../../_helpers/arrayHelpers';
import { percentageScoreConverter, isNumber } from '../../../../../_helpers/dataHelpers';

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

        const metadata : DatasetMetadata<number> = {
            mean : undefined,
            deviation : undefined,
            position : undefined
        }

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
            i,
            metadata
        }
    })

    //note - no values are guaranteed to be non-null, so mean etc could return undefined.
    //The consumer has control over whether or not to pass null values to the perfectSquare component or not
    //which will depend on the use case - do we want null values reported in the vis somehow, or not
    const datapointsWithMetadata : PerfectSquareDatapoint[] = datapointsWithOrderedMeasures.map(datapoint => {
        //@todo - user rollup
        const quadrantsWithMetadata = datapoint.quadrantsData.map(q => {
            const meanValue = d3.mean(q.values.map(v => v.value));
            return {
                ...q,
                metadata: { 
                    mean: isNumber(meanValue) ? Math.round(meanValue!) : undefined
                }
            }
        })
        const datapointMeanValue = d3.mean(quadrantsWithMetadata.map(q => q.metadata.mean));
        const allValues = datapoint.quadrantsData
            .map(q => q.values)
            .reduce((arr1, arr2) => ([...arr1, ...arr2]))
            .map(v => v.value);

        const datapointDeviationValue = d3.deviation(allValues)
        return {
            ...datapoint,
            quadrantsData : quadrantsWithMetadata,
            metadata : {
                ...datapoint.metadata,
                mean : isNumber(datapointMeanValue) ? Math.round(datapointMeanValue!) : undefined,
                deviation : isNumber(datapointDeviationValue) ? Number(datapointDeviationValue!.toFixed(1)) : undefined,
            }
        }
    });

    //add position to info for each datapoint
    const datapointsPositionedBySummaryMean = sortAscending(datapointsWithMetadata, d => d.metadata.mean)
        .map((d,i) => ({ 
            ...d, 
            metadata:{ 
                ...d.metadata, 
                position:i + 1 
            } 
        }));
    
    //update the info object in the ordered datapoints that we will actually return
    const datapointsWithMetadataAndPosition : PerfectSquareDatapoint[] = datapointsWithMetadata
        .map(d => ({ 
            ...d, 
            //can assert existence as both arrays are base off the same array, with no filtering of datapoints
            metadata:datapointsPositionedBySummaryMean.find(datapoint => datapoint.key === d.key)!.metadata
        }))
        .map(d => ({ 
            ...d, 
            subtitle: `Mean ${d.metadata.mean || "N/A"} / Deviation ${d.metadata.deviation || "N/A"}`
        }))

    //calc summary values of the entire set of datapoints    
    const minMean = d3.min(datapointsWithMetadata, d => d.metadata.mean);
    const maxMean = d3.max(datapointsWithMetadata, d => d.metadata.mean);
    const meanRange = minMean && maxMean ? maxMean - minMean : undefined;

    const minDeviation = d3.min(datapointsWithMetadata, d => d.metadata.deviation);
    const maxDeviation = d3.max(datapointsWithMetadata, d => d.metadata.deviation);
    const deviationRange = minDeviation && maxDeviation ? maxDeviation - minDeviation : undefined;

    const dataMetadata : DatasetMetadata<MeasureDataSummaryItem> = {
        mean:{ 
            min:minMean, max:maxMean, range:meanRange, order:"low-to-high" 
        },
        deviation:{ 
            min:minDeviation, max: maxDeviation, range:deviationRange, order:"high-to-low" 
        },
        //position will be used as a default date arrangement if there are dates
        position:{ 
            min: 0, max: datapoints.length, range:datapoints.length, order:"low-to-high" 
        },
    }
    
    return {
        ...data,
        measures, 
        datapoints : datapointsWithMetadataAndPosition,
        metadata : dataMetadata
    }
}

export default perfectSquareLayout;