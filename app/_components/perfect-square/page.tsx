/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import React, { useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import { PerfectSquareData, SimulationData } from '@/app/common-types/data-types';
import { AppContext } from "@/app/context";
import { VisualContext } from "../visual/context";
import { TooltipsContext } from '../visual/SVGVisual/hooks_and_modules/tooltips/context';
import { SVGDimensionsContext } from '../visual/SVGVisual/container';
import { ZoomContext } from '../visual/SVGVisual/hooks_and_modules/zoomable-g/page';
import perfectSquareLayout from './hooks_and_modules/svgComponents/perfectSquare/layout';
import perfectSquareComponent from "./hooks_and_modules/svgComponents/perfectSquare/component";
import { LOADING_TOOLTIP } from "./constants";
import { CHART_OUT_TRANSITION } from '@/app/constants';
import { useSimulation } from '../visual/SVGVisual/hooks_and_modules/simulation/simulation';
import usePerfectSquareCharts from "./hooks_and_modules/usePerfectSquareCharts";

/**
 * @description  Receives the data and other state, passes it through functions to prepare teh data, 
 * and calls useEffects which pass in settings to the svg component (non-react), and renders/updates it.
 * 
 * @returns {ReactElement}  A g which will contain the charts which are rendered in a useEffect.
 */

const PerfectSquare : React.FC = () => {
  const { visualDataResult:{ data, loading, error } } = useContext(AppContext);
  const { 
    selectedChartKey, selectedQuadrantIndex, selectedMeasureKey,
    setSelectedChartKey, setSelectedQuadrantIndex, setSelectedMeasureKey,
    displaySettings: { arrangeBy }
  } = useContext(VisualContext);

  const { 
    setLoadingTooltipsData, setChartsViewboxTooltipsData
  } = useContext(TooltipsContext);

  const { 
      //container, 
      grid,
      chart,
  } = useContext(SVGDimensionsContext);

  const { 
    zoomTransform, 
    zoomingInProgress, 
    zoomTo, 
    resetZoom, 
    isChartOnScreenChecker 
   } = useContext(ZoomContext);

  //dom refs
  const contentsGRef = useRef(null);

  //loading tooltip - we render visual even when loading because we want chart background to remain stable
  //@todo - move loading handling out
  useEffect(() => { 
    setLoadingTooltipsData(loading ? [LOADING_TOOLTIP] : []); 
},[loading, setLoadingTooltipsData])

  //DATA PROCESSING
  //data - control the way that a complete change of data is handled
  //@todo - move into a hook or HOC
  /*bug -  - when zoomed in, if we change the example, it resets zoom to 0 before removing old ds, so we see the ones jump...
    should remove them first, same problem as below
    - when moving between examples, sim must reload..best is just to turn it off? 
    - when zoom not =1, if user clicks simulation, we should reset zoom to 1 first,
    or tell user to do it*/
  const cleanup = useCallback(() => {
    //console.log("cleanup")
    setSelectedChartKey("");
    setSelectedQuadrantIndex(null);
    setSelectedMeasureKey("");
    resetZoom(false);
    //also update simulation here to turn it off
  }, [setSelectedChartKey, setSelectedQuadrantIndex, setSelectedMeasureKey, resetZoom]);

  const prevDataKeyRef = useRef("")
  useEffect(() => {
    if(prevDataKeyRef.current && prevDataKeyRef.current !== data?.key){
      //console.log("set timeout for cleanup")
      // the issue is that at this point the charts should start to fade out but they don't start until the timeout ends
      // we need to make a cool update with no data points... Maybe data.key needs to be in the deparr for one of the use effects that call render charts
      // Or have a separate use effect that is triggered by data.key
      setTimeout(() => {
        //reset settings
        cleanup();
      }, CHART_OUT_TRANSITION.duration)
    }
    prevDataKeyRef.current = data?.key || "";
  }, [data?.key])

  //@todo - refactor so we dont need to stringify grid - we need to prevent it being called duirng simulation 
  //as it overides the sim properties eg x and y on each datapoint
  const perfectSquareData : PerfectSquareData | null = useMemo(() => {
    if(!data || !grid) { return null; }
    return perfectSquareLayout(data, grid)
  }, [data, JSON.stringify(grid)]);

  const simulationData : SimulationData  | null = useMemo(() => {
    if(!perfectSquareData) { return null }
    return {
      key : perfectSquareData.key,
      nodesData : perfectSquareData.datapoints, 
      metadata : perfectSquareData.metadata
    } 
  },[perfectSquareData]);

  const { 
    simulationIsOn, 
  } = useSimulation(contentsGRef, simulationData);

  //CHART
  //initialise the main vis component
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);
  usePerfectSquareCharts(contentsGRef?.current, perfectSquareData, perfectSquare, simulationIsOn)
  
  return (
    <>
      <g className="perfect-square-contents" ref={contentsGRef}></g>
    </>
  )
}

export default PerfectSquare;


