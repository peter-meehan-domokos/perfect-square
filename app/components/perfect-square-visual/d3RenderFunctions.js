import * as d3 from 'd3';
import { remove, fadeIn } from '../../helpers/domHelpers';
import { CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';

/**
 * @description Runs the datapoints through a D3 enter-update-exit pattern to render the charts, and filters out those not on screen
 *
 * @param {Array} datapoints the datapoints that require to be displayed with a chart
 * @param {function} perfectSquare the main component that will render a chart in each container g it receives
 * @param {boolean} dataIsArranged a flag to show whether or not the force is applied, in which case the transform 
 * to position each chart is applied by the force rather than here 
 * 
 */
export function renderCharts(datapoints, perfectSquare, dataIsArranged, options={}){
    const { updateTransformTransition } = options;
    const chartG = d3.select(this).selectAll("g.chart").data(datapoints, d => d.key);
        chartG.enter()
        .append("g")
            .attr("class", "chart")
            .attr("id", d => `chart-${d.key}`)
            .call(fadeIn, { transition:CHART_IN_TRANSITION })
            .attr("transform", function(d,i){
                return dataIsArranged ? d3.select(this).attr("transform") : `translate(${d.cellX},${d.cellY})`
            })
            .merge(chartG)
            .each(function(d){
                //console.log("d", d)
                if(updateTransformTransition){
                    d3.select(this)
                        .transition()
                        .delay(updateTransformTransition.delay || 0)
                        .duration(updateTransformTransition.duration)
                            .attr("transform", (d,i) => dataIsArranged ? null : `translate(${d.cellX},${d.cellY})`);
                }else{
                    d3.select(this).attr("transform", (d,i) => dataIsArranged ? null : `translate(${d.cellX},${d.cellY})`);
                }
            })
            .attr("display", d => d.isOnScreen ? null : "none")
            .filter(d => d.isOnScreen)
            .call(perfectSquare);

    chartG.exit().call(remove, { transition:CHART_OUT_TRANSITION })
}

/**
 * @description Runs the tooltip data through a D3 enter-update-exit pattern to render the tooltip components
 *
 * @param {object} data 
 * @param {function} tooltip the component that renders a tooltip to each containing g in the selection it receives
 * @param {Number} width the width of the container
 * @param {Number} height the height of the container
 * 
 * @modifies 
 * @returns {object} 
 */

export function renderTooltips(data, tooltip, width, height){
    if(!width){ return; }

    const headerTooltipWidth = 150;
    const headerTooltipHeight = 150;
    const chartsViewboxTooltipWidth = 200;
    const chartsViewboxTooltipHeight = 60;

    const tooltipsData = data.map(d => ({
        ...d,
        enterTransitionType:d.area === "header" ? "slideFromTop" : "fadeIn",
        x:d.area === "header" ? width - headerTooltipWidth : (width - chartsViewboxTooltipWidth)/2,
        y:d.area === "header" ? 0 : (d.position === "top" ? 20 : height - 20 - chartsViewboxTooltipHeight),
        width:d.area === "header" ? headerTooltipWidth : chartsViewboxTooltipWidth,
        height:d.area === "header" ? headerTooltipHeight : chartsViewboxTooltipHeight
    }))

    const tooltipG = d3.select(this).select("svg.viz").selectAll("g.tooltip").data(tooltipsData, d => d.key);
    tooltipG.enter()
      .append("g")
        .attr("class", "tooltip")
        .each(function(d){
          const tooltipG = d3.select(this);
          //transition in
          if(d.enterTransitionType === "slideFromTop"){
            tooltipG
                .attr('clip-path', "url(#slide-tooltip-clip)")

            d3.select('clipPath#slide-tooltip-clip').select('rect')
                .attr('width', d.width)
                .attr('height', 0)
                .attr("rx", 5)
                .attr("ry", 5)
                    .transition()
                    .duration(500)
                        .attr('height', d.height)
          }else{
              tooltipG.attr("opacity", 0)
                  .transition()
                  .duration(500)
                      .attr("opacity", 1)
          }

        })
        .merge(tooltipG)
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .call(tooltip
          .width(d => d.width)
          .height(d => d.height)
          .styles(d => d.styles))

    tooltipG.exit().each(function(d){
      const tooltipG = d3.select(this);
      if(d.enterTransitionType === "slideFromTop"){
        d3.select('clipPath#slide-tooltip-clip').select('rect')
          .transition()
          .duration(500)
              .attr('height', 0)
              .on("end", () => { tooltipG.remove(); })
      }else{
        tooltipG.call(remove);
      }
    });
}