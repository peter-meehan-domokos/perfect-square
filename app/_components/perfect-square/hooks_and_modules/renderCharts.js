import * as d3 from 'd3';
import { remove, fadeIn } from '../../../_helpers/domHelpers';

/**
 * @description Runs the datapoints through a D3 enter-update-exit pattern to render the charts, and filters out those not on screen
 *
 * @param {Array} datapoints the datapoints that require to be displayed with a chart
 * @param {function} perfectSquare the main component that will render a chart in each container g it receives
 * @param {boolean} dataIsArranged a flag to show whether or not the force is applied, in which case the transform 
 * to position each chart is applied by the force rather than here 
 * 
 */
function renderCharts(datapoints=[], perfectSquare, dataIsArranged, options={}){
    const { transitions={} } = options;
    const chartG = d3.select(this).selectAll("g.chart").data(datapoints, d => d.key);
        chartG.enter()
        .append("g")
            .attr("class", "chart")
            .attr("id", d => `chart-${d.key}`)
            .call(fadeIn, { transition:transitions.enter || null })
            .attr("transform", function(d,i){
                return dataIsArranged ? d3.select(this).attr("transform") : `translate(${d.cellX},${d.cellY})`
            })
            .merge(chartG)
            .each(function(d,i){
                if(transitions.update){
                    d3.select(this)
                        .transition()
                        .delay(transitions.update.delay || 0)
                        .duration(transitions.update.duration || 0)
                            .attr("transform", (d,i) => dataIsArranged ? d3.select(this).attr("transform") : `translate(${d.cellX},${d.cellY})`);
                }else{
                    d3.select(this).attr("transform", (d,i) => dataIsArranged ? d3.select(this).attr("transform") : `translate(${d.cellX},${d.cellY})`);
                }
            })
            .call(perfectSquare, { transitions });

    //maybe inc duration here as a mutliple of exit().nodes().length up to a maximum of 1000
    //if it isnt working, but seems to be working
    chartG.exit().call(remove, { transition:transitions.exit || null })
}


export default renderCharts;