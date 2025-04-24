import * as d3 from 'd3';
import { remove, fadeIn } from '../../../_helpers/domHelpers';

/**
 * @description Runs the datapoints through a D3 enter-update-exit pattern to render the charts, and filters out those not on screen
 *
 * @param {Array} datapoints the datapoints that require to be displayed with a chart
 * @param {function} perfectSquare the main component that will render a chart in each container g it receives
 * @param {boolean} simulationIsOn a flag to show whether or not the force is applied, in which case the transform 
 * to position each chart is applied by the force rather than here 
 * 
 */
function renderCharts(datapoints=[], perfectSquare, simulationIsOn, options={}){
    console.log("render", datapoints.length)
    const { transitions={} } = options;
    const chartG = d3.select(this).selectAll("g.chart").data(datapoints, d => d.key);
        chartG.enter()
        .append("g")
            .attr("class", "chart")
            .attr("id", d => `chart-${d.key}`)
            .call(fadeIn, { transition:transitions.enter || null })
            //emtered nodes must all have transform added. This includes case where user zooms/pans to reveal new nodes
            .attr("transform", d => simulationIsOn ? `translate(${d.x},${d.y})` : `translate(${d.cellX},${d.cellY})`)
            .merge(chartG)
            .each(function(d,i){
                //updated nodes dont add transfomr as the simulation does it on tick
                if(transitions.update){
                    d3.select(this)
                        .transition()
                        .delay(transitions.update.delay || 0)
                        .duration(transitions.update.duration || 0)
                            .attr("transform", (d,i) => simulationIsOn ? d3.select(this).attr("transform") : `translate(${d.cellX},${d.cellY})`);
                }else{
                    d3.select(this).attr("transform", (d,i) => simulationIsOn ? d3.select(this).attr("transform") : `translate(${d.cellX},${d.cellY})`);
                }
            })
            .call(perfectSquare, { transitions });

    chartG.exit().call(remove, { transition:transitions.exit || null })
}


export default renderCharts;