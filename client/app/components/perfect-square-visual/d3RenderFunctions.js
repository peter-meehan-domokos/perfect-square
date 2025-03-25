import * as d3 from 'd3';
import { remove, fadeIn } from '../../helpers/domHelpers';
import { CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';

export function renderCharts(datapoints, perfectSquare, dataIsArranged, simTicksInProcess, options={}){
    const { updateTransformTransition } = options;
    const chartG = d3.select(this).selectAll("g.chart").data(datapoints, d => d.key);
        chartG.enter()
        .append("g")
            .attr("class", "chart")
            .attr("id", d => `chart-${d.key}`)
            .call(fadeIn, { transition:CHART_IN_TRANSITION })
            .attr("transform", function(d,i){
                return dataIsArranged ? d3.select(this).attr("transform") : `translate(${d.gridX},${d.gridY})`
            })
            .merge(chartG)
            .each(function(d){
                if(updateTransformTransition){
                    d3.select(this)
                        .transition()
                        .delay(updateTransformTransition.delay || 0)
                        .duration(updateTransformTransition.duration)
                            .attr("transform", (d,i) => dataIsArranged ? null : `translate(${d.gridX},${d.gridY})`);
                }else{
                    d3.select(this).attr("transform", (d,i) => dataIsArranged ? null : `translate(${d.gridX},${d.gridY})`);
                }
            })
            .attr("display", d => d.isOnScreen ? null : "none")
            .filter(d => d.isOnScreen)
            .call(perfectSquare);

    chartG.exit().call(remove, { transition:CHART_OUT_TRANSITION })
}