'use client'
import * as d3 from "d3";
import { remove } from '../../../../../_helpers/domHelpers';
import { FADE_IN_OUT_DURATION } from '@/app/constants';

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

export default function renderTooltips(data, tooltip, width, height){
    if(!width){ return; }

    const headerTooltipWidth = 150;
    const headerTooltipHeight = 150;
    const chartsViewboxTooltipWidth = 200;
    const chartsViewboxTooltipHeight = 60;

    const tooltipsData = data.map(d => ({
        ...d,
        enterTransitionType:d.area === "header" ? "slideFromTop" : "fadeIn",
        x:d.position === "top-right" ? width - headerTooltipWidth : (width - chartsViewboxTooltipWidth)/2,
        y:d.position === "top-right" ? 0 : (d.position === "top" ? 20 : height - 20 - chartsViewboxTooltipHeight),
        width:d.type === "header" ? headerTooltipWidth : chartsViewboxTooltipWidth,
        height:d.type === "header" ? headerTooltipHeight : chartsViewboxTooltipHeight
    }))

    //bind by type, as there will only be one tooltip shpwing per type
    const tooltipG = d3.select(this).selectAll("g.tooltip").data(tooltipsData, d => d.type);
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
                    .duration(FADE_IN_OUT_DURATION.SLOW)
                        .attr('height', d.height)
          }else{
              tooltipG.attr("opacity", 0)
                  .transition()
                  .duration(FADE_IN_OUT_DURATION.SLOW)
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
        tooltipG.call(remove, { transition:{ duration:FADE_IN_OUT_DURATION.SLOW }});
      }
    });
}