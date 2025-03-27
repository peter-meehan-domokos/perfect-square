import * as d3 from 'd3';

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