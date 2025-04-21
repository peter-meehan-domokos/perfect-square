'use client'
import react, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from 'd3';
import { isChartOnScreenCheckerFunc, calcZoomTransformFunc } from "../../../../perfect-square/helpers";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, RESET_ZOOM_DURATION } from '@/app/constants';

/**
 * @description A hook that applies zoom functionality to a container, which also includes charts
 * @param {Ref} containerRef a ref to the container on which the zoom behaviour (d3.zoom) is called
 * @param {Ref} viewGRef a ref to the child of the container on which the zooom transforms are applied.
 * @param {Number} contentsWidth the width of the zoom space
 * @param {Number} contentsHeight the height of zoom space
 * @param {Number} margin the height of zoom space
 * @param {Number} chartWidth the width of each chart, needed for zoomTo 
 * @param {Number} chartHeight the height of each chart, needed for zoomTo 
 * @param {function} _chartX an accessor function to get the x position of each chart, needed for zoomTo 
 * @param {function} _chartY an accessor function to get the y position of each chart, needed for zoomTo 
 * @param {function} onStart an optional callback function for the 'start' zoom event
 * 
 * @return {object} an object containing the current zoom state, and some utility functions
 */
export const useZoom = (containerRef, viewGRef, contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY, onStart=()=>{}, onZoom=()=>{}) => {
  //zoom state is only used for React children ie Header as its also store in d3 zoom behaviour object
  const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity);
  const [zoomingInProgress, setZoomingInProgress] = useState(null);
  const zoomRef = useRef(null);

  const isChartOnScreenChecker = useCallback((chartD, zoomTransformState) => {
    const checker = isChartOnScreenCheckerFunc(contentsWidth, contentsHeight, chartWidth, chartHeight, _chartX, _chartY);
    return checker(chartD, zoomTransformState);
  },[contentsWidth, contentsHeight, chartWidth, chartHeight, _chartX, _chartY])

  const resetZoom = useCallback((withTransition=true) => { 
    if(!containerRef || !containerRef.current){ return; }
    if(withTransition){
      //tell d3comp we are zooming to a level 1, so it can ignore level 2 (if we are at level 3)
      setZoomingInProgress({ targK: d3.zoomIdentity.k, sourceEvent:null })

      d3.select(containerRef.current)
        .transition()
        .duration(RESET_ZOOM_DURATION)
          .call(zoomRef.current.transform, d3.zoomIdentity)
          .on("end", () => { setZoomingInProgress(null); });
    }else{
      d3.select(containerRef.current).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, [containerRef])

  const zoomTo = useCallback((chartD, cb=() => {}) => {
    if(!containerRef || !containerRef.current){ return; }
    const calcZoomTransform = calcZoomTransformFunc(contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY);
    const transform = calcZoomTransform(chartD);
    //tell perfectSqaure it is zooming to a level 3, so it can ignore level 2 (if it starts at level 1)
    setZoomingInProgress({ targK:transform.k, sourceEvent:null })
    
    d3.select(containerRef.current)
      .transition()
      .duration(ZOOM_AND_ARRANGE_TRANSITION_DURATION)
        .call(zoomRef.current.transform, transform)
        .on("end", function(){ 
          setZoomingInProgress(null);
          cb(); 
        })

  },[contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY, containerRef]);

  useEffect(() => {
    if(!containerRef || !containerRef.current){ return; }
    if(!zoomRef.current){ zoomRef.current = d3.zoom(); }
 
    setupZoom(zoomRef.current, contentsWidth, contentsHeight, chartWidth, chartHeight, {
      onStart:onStart,
      onZoom:zoomed
    });

    //call zoom
    d3.select(containerRef.current).call(zoomRef.current)
      .on("dblclick.zoom", null);

    function zoomed(e){
      d3.select(viewGRef.current).attr("transform", e.transform);
      //update react state so it can trigger any other changes needed
      setZoomTransformState(e.transform);
      //callback
      onZoom(e.transform);
    }
  
  //@todo - remove disabling and remove the stringify functions on dep array - not needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[contentsWidth, contentsHeight, chartWidth, chartHeight, JSON.stringify(_chartX), JSON.stringify(_chartY), onStart, containerRef, viewGRef])
  
  return { zoomTransformState, zoomingInProgress, zoomTo, resetZoom, isChartOnScreenChecker };

};


/**
 * @description Calculates and applies basic settings to the zoom, and attaches event handlers 
 *
 * @param {D3ZoomBehaviourObject} zoom the d3 zoom behaviour object, initialised by d3.zoom()
 * @param {Number} contentsWidth the width of the zoom space
 * @param {Number} contentsHeight the height of zoom space
 * @param {Number} chartWidth the width of each individual chart
 * @param {Number} chartHeight the height of each individual chart
 * @param {object} options the optional event handlers to be attached
 * 
 */
function setupZoom(zoom, contentsWidth, contentsHeight, chartWidth, chartHeight, options={}){
    const { onStart=()=>{}, onZoom=()=>{}, onEnd=()=>{} } = options;
    //we allow user to zoom into margin, as more immersive (ie no artifical boundary)
    const kMax = d3.max([contentsWidth/chartWidth, contentsHeight/chartHeight]);
    zoom
      .scaleExtent([1, kMax])
      //@todo - make this contentsWidth and height, and shoft zoomG too by the margin
      .translateExtent([[0, 0], [contentsWidth, contentsHeight]])
      .on("start", onStart)
      .on("zoom", onZoom)
      .on("end", onEnd);
}