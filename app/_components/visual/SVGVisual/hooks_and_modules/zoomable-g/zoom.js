'use client'
import react, { useState, useEffect, useRef, useCallback, useContext } from "react";
import * as d3 from 'd3';
import { VisualContext } from "../../../context";
import { isChartOnScreenCheckerFunc, calcZoomTransformFunc } from "../../../../perfect-square/helpers";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, RESET_ZOOM_DURATION } from "@/app/constants";

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
  const { externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject } = useContext(VisualContext);
  //zoom state is only used for React children ie Header as its also store in d3 zoom behaviour object
  const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity);
  const [zoomingInProgress, setZoomingInProgress] = useState(null);
  const zoomRef = useRef(null);


  const isChartOnScreenChecker = useCallback((chartD) => {
    if(!chartWidth || !chartHeight){ return;}
    const checker = isChartOnScreenCheckerFunc(contentsWidth, contentsHeight, chartWidth, chartHeight, _chartX, _chartY, zoomTransformState);
    return checker(chartD);
  },[contentsWidth, contentsHeight, chartWidth, chartHeight, _chartX, _chartY, zoomTransformState])

  const applyZoom = useCallback((requiredTransform, requiredTransition, callback = () => {}) => { 
    if(!containerRef || !containerRef.current){ return; }
    if(requiredTransition){
      //tell d3comp we are zooming to a level 1, so it can ignore level 2 (if we are at level 3)
      setZoomingInProgress({ targK: requiredTransform.k, sourceEvent:null })

      d3.select(containerRef.current)
        .transition()
        .duration(requiredTransition?.duration || 200)
          .call(zoomRef.current.transform, requiredTransform)
          .on("end", () => { 
            setZoomingInProgress(null); 
            callback();
          });
    }else{
      d3.select(containerRef.current).call(zoomRef.current.transform, requiredTransform);
    }
  }, [containerRef])

  const resetZoom = useCallback((withTransition=true) => { 
    if(!containerRef || !containerRef.current || !zoomRef.current){ return; }
    const requiredTransition = withTransition ? { duration: RESET_ZOOM_DURATION } : undefined;
    applyZoom(d3.zoomIdentity, requiredTransition)
  }, [applyZoom, containerRef])

  const zoomTo = useCallback((chartD, callback=() => {}) => {
    if(!chartWidth || !chartHeight){ return;}
    if(!containerRef || !containerRef.current || !zoomRef.current){ return; }
    const calcZoomTransform = calcZoomTransformFunc(contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY);
    const requiredTransform = calcZoomTransform(chartD);
    const requiredTransition = { duration: ZOOM_AND_ARRANGE_TRANSITION_DURATION };
    applyZoom(requiredTransform, requiredTransition, callback)
  },[applyZoom, containerRef, contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY]);

  useEffect(() => {
    if(!chartWidth || !chartHeight){ return;}
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
  
  useEffect(() => {
    if(!chartWidth || !chartHeight){ return;}
    if(externallyRequiredZoomTransformObject){
      const { requiredTransform, requiredTransition, callback } = externallyRequiredZoomTransformObject;
      applyZoom(requiredTransform, requiredTransition, callback);
      setExternallyRequiredZoomTransformObject(null);
    }
  }, [externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject, chartWidth, chartHeight, applyZoom])

  return { zoomTransformState, zoomingInProgress, applyZoom, zoomTo, resetZoom, isChartOnScreenChecker };

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