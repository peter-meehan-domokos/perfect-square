'use client'
import { RefObject, useState, useEffect, useCallback, useContext, useMemo } from "react";
import * as d3 from 'd3';
import { ZoomTransform, D3ZoomEvent } from "d3-zoom";
import { ZoomContext, ZoomingInProgress } from "./page";
import { ContainerWithDatapointPositioning, Transition } from '@/app/_components/visual/types';
import { HandlerFnWithNoArgs, ZoomCallbacks } from "@/app/types/function-types";
import { VisualContext } from "../../../context";
import { Container } from '@/app/_components/visual/types';
import { PositionedDatapoint } from "@/app/types/data-types";
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
 * @description A hook that applies zoom functionality to a container with charts
 * 
 * @param {React.RefObject<Element>} containerRef - Ref to the container for zoom behavior
 * @param {React.RefObject<Element>} viewRef - Ref to the child element for zoom transforms
 * @param {Object} container - Container configuration
 * @param {number} container.contentsWidth - Width of the zoom space
 * @param {number} container.contentsHeight - Height of zoom space
 * @param {Object} chart - Chart configuration
 * @param {number} chart.width - Width of each chart
 * @param {number} chart.height - Height of each chart
 * @param {Function} chart.x - Accessor function for chart x position
 * @param {Function} chart.y - Accessor function for chart y position
 * @param {Object} [callbacks] - Optional zoom event callbacks
 * @param {Function} [callbacks.onStart] - Handler for zoom start
 * @param {Function} [callbacks.onZoom] - Handler for zoom
 * @param {Function} [callbacks.onEnd] - Handler for zoom end
 * 
 * @returns {Object} Current zoom state and utility functions
 */
export const useZoom : UseZoomFn = (containerRef, viewRef, container, chart, callbacks) => {
  const { externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject } = useContext(VisualContext);
  const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);
  const [zoomingInProgress, setZoomingInProgress] = useState<ZoomingInProgress | null>(null);
  // @ts-ignore - d3-zoom type inference is complex, ignoring to preserve working functionality
  const zoom = useMemo(() => d3.zoom(), []);
  const domElementsRendered = containerRef && viewRef;

  useEffect(() => {
    if(!chart || !container){ return;}
    if(!containerRef || !containerRef.current){ return; }

    // @ts-ignore - d3-zoom type inference is complex, ignoring to preserve working functionality
    setupZoom(zoom, container, chart, {
      onStart:callbacks.onStart ? callbacks.onStart : () => {},
      onZoom:(e : D3ZoomEvent<SVGElement, PositionedDatapoint>) => {
        //usng ts-ignore due to d3 type inaccuracy from definitelytyped - it doesnt recognise transform obj as acceptable param
        //@todo - create a custom type declaration that extends the d3 type definitions to properly include ZoomTransform as a valid attribute value
        // @ts-ignore
        d3.select(viewRef.current).attr("transform", e.transform);
        //update react state so it can trigger any other changes needed
        setZoomTransform(e.transform);
        //callback
        if(callbacks.onZoom){ callbacks.onZoom(e); }
      }
    });

    //call zoom
    // @ts-ignore
    d3.select(containerRef.current).call(zoom)
      .on("dblclick.zoom", null);
  
  },[container, chart, callbacks, containerRef, viewRef, zoom])

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
  }, [containerRef, zoom.transform, domElementsRendered])

  const resetZoom = useCallback((withTransition=true) => { 
    //next - this must initially send message to color the greyed out charts
    if(!domElementsRendered){ return; }

    const requiredTransition : Transition | undefined = withTransition ? { duration: RESET_ZOOM_DURATION } : undefined;
    applyZoom(d3.zoomIdentity, requiredTransition)
  }, [domElementsRendered, applyZoom])

  const zoomTo = useCallback((chartDatum : PositionedDatapoint, callback=() => {}) => {
    if(!chart || !container || !domElementsRendered){ return;}
    //issue - this next line could be undefined if chart.width or height are 0.
    //ideal soln is make them non-zero by defn of Container (perhaps use a brand) 
    const calcZoomTransform = calcZoomTransformFunc(container, chart);
    const requiredTransform = calcZoomTransform(chartDatum);
    if(!requiredTransform) { return; }
    const requiredTransition = { duration: ZOOM_AND_ARRANGE_TRANSITION_DURATION };
    applyZoom(requiredTransform, requiredTransition, callback)
  },[applyZoom, container, chart, domElementsRendered]);
  
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