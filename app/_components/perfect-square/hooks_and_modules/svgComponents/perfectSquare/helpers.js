
import { isNumber } from '@/app/_helpers/dataHelpers';
import { immutableReverse } from '@/app/_helpers/arrayHelpers';

export function quadrantsContainerTransform(selection, width, height, selectedQuadrantIndex){
    const chartTransformOrigin = 
        selectedQuadrantIndex === 0 ? `${width} ${height}` :
        selectedQuadrantIndex === 1 ? `0 ${height}` :
        selectedQuadrantIndex === 2 ? `${width} 0` :
        `0 0`;

    const chartTransform = `scale(${isNumber(selectedQuadrantIndex) ? 0.5 : 1})`;
    selection
        .transition()
        .delay(isNumber(selectedQuadrantIndex) ? 0 : 75)
        .duration(500)
            .attr("transform", chartTransform)
            .attr("transform-origin", chartTransformOrigin)
}


export function quadrantTransform(selection, quadrantWidth, quadrantHeight, selectedQuadrantIndex){
    const transformOrigin =
        selectedQuadrantIndex === 0 ? `${quadrantWidth} ${quadrantHeight}` :
        selectedQuadrantIndex === 1 ? `0 ${quadrantHeight}` :
        selectedQuadrantIndex === 2 ? `${quadrantWidth} 0` :
        `0 0`;

    selection.select("g.quadrant")
        .transition()
        .delay(isNumber(selectedQuadrantIndex) ? 75 : 0)
        .duration(500)
            .attr("transform", quadD => `scale(${quadD.i === selectedQuadrantIndex ? 3 : 1})`)
            .attr("transform-origin", transformOrigin);
    
}

export function chartPathD(data, quadrantBarWidths, barsAreaHeight, gapBetweenBars){
    const { quadrantsData } = data;
    //we must swap quadrants 2 and 3 (ie the bottom 2) so we can draw the line
    //@todo - would make sense to just change this for entire app, so q3 becomes bot-left and 2 is bot right
    //we also reverse the bars for the bottom two quadrants
    const reorderedQuadrants = [quadrantsData[0], quadrantsData[1], quadrantsData[3], quadrantsData[2]]
        .map(q => q.i <= 1 ? q : { ...q, values:immutableReverse(q.values) });
    //const values = quadrantsData
    const values = reorderedQuadrants
        .map(q => (q.values
            .map((v,i) => ({ 
                ...v, 
                quadIndex:q.i, 
                //note q2 and 3 have been swapped, so q.i === 3 is for quad 2 here
                isFirstQ2Value:q.i === 3 && i === 0,
                isEndValue:q.i === 1 && i === q.values.length-1 || q.i === 2 && i === q.values.length-1
            })))
        )
        .reduce((vs1, vs2) => [...vs1, ...vs2])

    //paths still wrong
    //1. the 1st bar of q1 starts to go wrong....
    const barOutlines = values.map((v, valueIndex) => {
        const { quadIndex, calcBarHeight, isEndValue, isFirstQ2Value } = v;
        const barWidth = quadrantBarWidths[quadIndex];
        const prevHeight = valueIndex === 0 ? 0 : values[valueIndex - 1].calcBarHeight(barsAreaHeight);
        const heightDelta = isFirstQ2Value ? (calcBarHeight(barsAreaHeight) + prevHeight) : (calcBarHeight(barsAreaHeight) - prevHeight);
        if(quadIndex <= 1){
            return `v ${-heightDelta} h ${barWidth + (isEndValue ? 0 : gapBetweenBars)} `
        }
        return `v ${heightDelta} h ${-barWidth - (isEndValue ? 0 : gapBetweenBars)} `
        
    })
    .reduce((str1, str2) => `${str1} ${str2}`)
    const lastHeight = values[values.length - 1].calcBarHeight(barsAreaHeight)
    return `M 0 ${barsAreaHeight} ${barOutlines} v ${-lastHeight} z`;
}

export function quadrantPathD(values, quadIndex, barsAreaHeight, barWidth, gapBetweenBars){
    const barsOutline = values
        .map((v, valueIndex) => {
            const isLastValue = valueIndex == values.length - 1;
            const prevHeight = valueIndex === 0 ? 0 : values[valueIndex - 1].calcBarHeight(barsAreaHeight);
            const heightDelta = (v.calcBarHeight(barsAreaHeight) - prevHeight) * (quadIndex <= 1 ? -1 : 1);
            return `v ${heightDelta} h ${barWidth + (isLastValue ? 0 : gapBetweenBars)} `
        })
        .reduce((str1, str2) => `${str1} ${str2}`)

    const lastHeight = values[values.length-1].calcBarHeight(barsAreaHeight);
    if(quadIndex <= 1){
        //z wont work to close the path as we have moved it at the start
        return `M 0 ${barsAreaHeight} ${barsOutline} v ${lastHeight} h -${barWidth * values.length}`
    }
    return `M 0 0 ${barsOutline} v -${lastHeight} z`
}


