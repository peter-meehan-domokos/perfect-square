'use client'
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from 'd3';
import { isArranged, isChartOnScreenCheckerFunc, calcZoomTransformFunc } from "./helpers";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION } from '@/app/constants';

/*

 - remove need to pass perfectSquare, instead we just have callbacks specified to the circumstances 
*/

export const useZoom = (containerElementRef, viewGRef, containerDimns, chartWidth, chartHeight, perfectSquare, _chartX, _chartY, onStart) => {
  //zoom state is only used for React children ie Header as its also store in d3 zoom behaviour object
  const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity);
  const zoomRef = useRef(null);

  const { width, height, margin, contentsWidth, contentsHeight } = containerDimns;

  //const isChartOnScreenChecker = () => useCallback((d, zoomTransform) => {
  const isChartOnScreenChecker = (d, zoomTransform) => {
    const checker = isChartOnScreenCheckerFunc(contentsWidth, contentsHeight, chartWidth, chartHeight, _chartX, _chartY);
    return checker(d, zoomTransform);
  //},[contentsWidth, contentsHeight, _chartX, _chartY])
  }

  const resetZoom = (withTransition=true) => { 
    if(!containerElementRef || !containerElementRef.current){ return; }
    if(withTransition){
      //tell d3comp we are zooming to a level 1, so it can ignore level 2 (if we are at level 3)
      perfectSquare.zoomingInProgress({ targK: d3.zoomIdentity.k, sourceEvent:null })

      d3.select(containerElementRef.current)
        .transition()
        .duration(ZOOM_AND_ARRANGE_TRANSITION_DURATION)
          .call(zoomRef.current.transform, d3.zoomIdentity);
    }else{
      d3.select(containerElementRef.current).call(zoom.transform, d3.zoomIdentity);
    }
  }

  const zoomTo = useCallback((chartD, cb=() => {}) => {
    console.log("zoomTo-------------------------------------")
    if(!containerElementRef || !containerElementRef.current){ return; }
    //when sim on, it still zooms in based on colnr
    const calcZoomTransform = calcZoomTransformFunc(contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY);
    const transform = calcZoomTransform(chartD);
    
    //tell d3comp we are zooming to a level 3, so it can ignore level 2 (if we are at level 1)
    perfectSquare.zoomingInProgress({ targK:transform.k, sourceEvent:null })
    
    d3.select(containerElementRef.current)
      .transition()
      .duration(ZOOM_AND_ARRANGE_TRANSITION_DURATION)
        .call(zoomRef.current.transform, transform)
        .on("end", function(){ cb(); })

  },[contentsWidth, contentsHeight, _chartX, _chartY])

  useEffect(() => {
    if(!containerElementRef || !containerElementRef.current){ return; }
    if (/*isFirstRenderRef.current || */!contentsWidth) { return; }
    if(!zoomRef.current){ zoomRef.current = d3.zoom(); }

    setupZoom(zoomRef.current, width, height, chartWidth, chartHeight, {
      onStart:onStart,
      onZoom:zoomed
    });

    //call zoom
    d3.select(containerElementRef.current).call(zoomRef.current)
      .on("dblclick.zoom", null);

    function zoomed(e){
      d3.select(viewGRef.current).attr("transform", e.transform);

      //update semantic zoom and virtualisation in the dom
      d3.select(containerElementRef.current).selectAll("g.chart")
        .each(function(d){ 
          d.isOnScreen = isChartOnScreenChecker(d, e.transform); 
        })
        .attr("display", d => d.isOnScreen ? null : "none")
        .filter(d => d.isOnScreen)
        .call(perfectSquare
          .zoomK(e.transform.k, true));

      //update react state
      setZoomTransformState(e.transform);
    }
    
  },[width, height, contentsWidth, contentsHeight, _chartX, _chartY])
  
  return { zoomTransformState, zoomTo, resetZoom };

};


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
function setupZoom(zoom, width, height, chartWidth, chartHeight, options={}){
    const { onStart=()=>{}, onZoom=()=>{}, onEnd=()=>{} } = options;
    //we allow user to zoom into margin, as more immersive (ie no artifical boundary)
    const kMax = d3.max([width/chartWidth, height/chartHeight]);
    zoom
      .scaleExtent([1, kMax])
      //@todo - make this contentsWidth and height, and shoft zoomG too by the margin
      .translateExtent([[0, 0], [width, height]])
      .on("start", onStart)
      .on("zoom", onZoom)
      .on("end", onEnd);
}