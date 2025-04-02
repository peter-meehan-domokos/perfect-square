import * as d3 from 'd3';

/**
 * @description Calculates and applies basic settings to the zoom, and attaches event handlers 
 *
 * @param {D3ZoomBehaviourObject} zoom the d3 zoom behaviour object, initialised by d3.zoom()
 * @param {Number} width the width of the zoom space
 * @param {Number} contentsHeight the height of zoom space
 * @param {Number} chartWidth the width of each individual chart
 * @param {Number} chartHeight the height of each individual chart
 * @param {object} options the optional event handlers to be attached
 * 
 */
export function setupZoom(zoom, width, height, chartWidth, chartHeight, options={}){
    const { onStart=()=>{}, onZoom=()=>{}, onEnd=()=>{} } = options;
    //we allow user to zoom into margin, as more immersive (ie no artifical boundary)
    const kMax = d3.max([width/chartWidth, height/chartHeight]);
    zoom
      .scaleExtent([1, kMax])
      //@todo - make this contentsWidth and height, and shoft zoomG too by the margin
      .translateExtent([[0, 0], [width, height]])
      .on("start", onStart)
      .on("zoom", onZoom)
      .on("end", onEnd)
}