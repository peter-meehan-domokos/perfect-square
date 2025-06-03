'use client'
import { RefObject, useState, useEffect, useCallback, useContext, useMemo } from "react";
import * as d3 from 'd3';
import { ZoomTransform, D3ZoomEvent, ZoomBehavior, ZoomedElementBaseType } from "d3-zoom";
import { ZoomContext, ZoomingInProgress } from "./page";
import { ContainerWithDatapointPositioning, PositionedDatapoint, Transition } from '@/app/common-types/data-types';
import { HandlerFnWithNoArgs, ZoomCallbacks } from "@/app/common-types/function-types";
import { VisualContext } from "../../../context";
import { Container } from '@/app/common-types/data-types';
import { isChartOnScreenCheckerFunc, calcZoomTransformFunc, setupZoom } from "./helpers";
import { RESET_ZOOM_DURATION, ZOOM_AND_ARRANGE_TRANSITION_DURATION } from "@/app/constants";

interface UseZoomFn {
  (
    containerRef : RefObject<SVGElement | SVGGElement | HTMLDivElement | null>,
    viewRef : RefObject<SVGElement | SVGGElement | HTMLDivElement | null>,
    container : Container | null,
    chart : ContainerWithDatapointPositioning | null,
    callbacks : ZoomCallbacks
  ) : ZoomContext
}
/**
 * @description A hook that applies zoom functionality to a container, which also includes charts
 * @param {Ref} containerRef a ref to the container on which the zoom behaviour (d3.zoom) is called
 * @param {Ref} viewRef a ref to the child of the container on which the zooom transforms are applied.
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
export const useZoom : UseZoomFn = (containerRef, viewRef, container, chart, callbacks) => {
  const { externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject } = useContext(VisualContext);
  //React must also store the zoom state (even though its available on the d3.zoom behaviour object)
  //because some React components must update inline with zoom eg Header 
  const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);
  const [zoomingInProgress, setZoomingInProgress] = useState<ZoomingInProgress | null>(null);
  //the d3 zoom behaviour
  const zoom : ZoomBehavior<ZoomedElementBaseType, PositionedDatapoint> = useMemo(() => d3.zoom(), [])
  //@todo - add flags to useEffect dep array if its a good idea, think about linting rules and why they are there
  //this flags add clarity: they wont cause useEffects to trigger, but these will be set to true before
  //container and chart are defined, so we can be sure they will get triggered after these are rendered
  const domElementsRendered = containerRef && viewRef;

  //main set up
  useEffect(() => {
    if(!chart || !container){ return;}
    if(!containerRef || !containerRef.current){ return; }

    setupZoom(zoom, container, chart, {
      onStart:callbacks.onStart ? callbacks.onStart : () => {},
      // @ts-ignore
      onZoom:(e : D3ZoomEvent<SVGElement, PositionedDatapoint>) => {
        // @ts-ignore
        d3.select(viewRef.current).attr("transform", e.transform);
        //update react state so it can trigger any other changes needed

        //next - check does this trigger isonscreen to run in usePSCharts? if so, is the checker updatd properly?
        setZoomTransform(e.transform);
        //callback
        if(callbacks.onZoom){ callbacks.onZoom(e); }
      }
    });

    //call zoom
    // @ts-ignore
    d3.select(containerRef.current).call(zoom)
      .on("dblclick.zoom", null);
  
  },[container, chart, callbacks, containerRef, viewRef])

  const isChartOnScreenChecker = useCallback((chartD : PositionedDatapoint) => {
    if(!chart || !container){ return false;}
    const checker = isChartOnScreenCheckerFunc(container, chart, zoomTransform);
    return checker(chartD);
  },[container, chart, zoomTransform])

  const applyZoom = useCallback((
    requiredTransform : ZoomTransform, 
    requiredTransition : Transition | undefined, 
    callback : HandlerFnWithNoArgs = () => {}
  ) => { 
    if(!domElementsRendered){ return; }
    if(requiredTransition){
      //tell d3comp we are zooming to a level 1 (so it can ignore level 2 if we are at level 3)
      setZoomingInProgress({ targK: requiredTransform.k, sourceEvent:null })

      d3.select(containerRef.current)
        .transition()
        .duration(requiredTransition?.duration || 200)
        // @ts-ignore
        .call(zoom.transform, requiredTransform)
          .on("end", () => { 
            setZoomingInProgress(null); 
            callback();
          });
    }else{
      // @ts-ignore
      d3.select(containerRef.current).call(zoom.transform, requiredTransform);
    }
  }, [])

  const resetZoom = useCallback((withTransition=true) => { 
    //next - this must initially send message to color the greyed out charts
    if(!domElementsRendered){ return; }

    const requiredTransition : Transition | undefined = withTransition ? { duration: RESET_ZOOM_DURATION } : undefined;
    applyZoom(d3.zoomIdentity, requiredTransition)
  }, [applyZoom, containerRef])

  const zoomTo = useCallback((chartDatum : PositionedDatapoint, callback=() => {}) => {
    if(!chart || !container || !domElementsRendered){ return;}
    //issue - this next line could be undefined if chart.width or height are 0.
    //ideal soln is make them non-zero by defn of Container (perhaps use a brand) 
    const calcZoomTransform = calcZoomTransformFunc(container, chart);
    const requiredTransform = calcZoomTransform(chartDatum);
    if(!requiredTransform) { return; }
    const requiredTransition = { duration: ZOOM_AND_ARRANGE_TRANSITION_DURATION };
    applyZoom(requiredTransform, requiredTransition, callback)
  },[applyZoom, containerRef, container, chart]);
  
  useEffect(() => {
    if(externallyRequiredZoomTransformObject){
      const { requiredTransform, requiredTransition, callback } = externallyRequiredZoomTransformObject;
      applyZoom(requiredTransform, requiredTransition, callback);
      setExternallyRequiredZoomTransformObject(null);
    }
  }, [externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject, applyZoom])

  return { 
    zoomTransform, 
    zoomingInProgress, 
    applyZoom, 
    zoomTo, 
    resetZoom, 
    isChartOnScreenChecker
  };

};