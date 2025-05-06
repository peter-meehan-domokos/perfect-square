/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import React, { useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import * as d3 from 'd3';
import { PositionedDatapoint, PerfectSquareData } from '@/app/common-types/data-types';
import {  } from '@/app/common-types/function-types';
import { AppContext } from "@/app/context";
import { VisualContext } from "../visual/context";
import { TooltipsContext } from '../visual/SVGVisual/hooks_and_modules/tooltips/context';
import { SVGDimensionsContext } from '../visual/SVGVisual/container';
import { ZoomContext } from '../visual/SVGVisual/hooks_and_modules/zoomable-g/page';
import perfectSquareLayout from './hooks_and_modules/svgComponents/perfectSquare/layout';
import perfectSquareComponent from "./hooks_and_modules/svgComponents/perfectSquare/component";
import renderCharts from './hooks_and_modules/renderCharts';
import { SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';
import { useSimulation } from '../visual/SVGVisual/hooks_and_modules/simulation/simulation';

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

  //loading tooltip
  useEffect(() => { 
    setLoadingTooltipsData(loading ? [LOADING_TOOLTIP] : []); 
},[loading, setLoadingTooltipsData])

  //DATA PROCESSING
  //data - control the way that a complete change of data is handled
  const cleanup = useCallback(() => {
    setSelectedChartKey("");
    setSelectedQuadrantIndex(null);
    setSelectedMeasureKey("");
    resetZoom(false);
  }, [setSelectedChartKey, setSelectedQuadrantIndex, setSelectedMeasureKey, resetZoom]);

  const prevDataKeyRef = useRef("")
  useEffect(() => {
    if(prevDataKeyRef.current && prevDataKeyRef.current !== data?.key){
      setTimeout(() => {
        //reset settings
        cleanup();
      }, CHART_OUT_TRANSITION.duration)
    }
    prevDataKeyRef.current = data?.key || "";
  }, [data?.key])

  //issue is layout isnt always applied

  //@todo - handle null data before here, 
  //also handle datapoints undefined - this just shouldnt be allowed, any exampledata must have datapoints defined
  //changed layout so it returns null at first, and also may return data with no datapoints defined eg datapoints = undefined
  const perfectSquareData : PerfectSquareData | null = useMemo(() => {
    if(!data || !grid) { return null; }
    return perfectSquareLayout(data, grid)
  }, [data, grid]);

  //simulation - turns on when user selects an 'arrangeBy' setting
  const simulationData = { nodesData:perfectSquareData?.datapoints || [], info:perfectSquareData?.info || {} }
  const { 
    simulationIsOn, 
    //simulationHasBeenTurnedOnOrOff 
  } = useSimulation(contentsGRef, simulationData);

  //CHART
  //initialise the main vis component
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);

  //CHARTS RELATED USE-EFFECTS
  //apply dimensions
  useEffect(() => {
    if(!chart){ return; }
    perfectSquare
      .width(chart.width)
      .height(chart.height)
      .margin(chart.margin);

  }, [chart])
  
  //apply settings
  useEffect(() => {
    if(!perfectSquareData){ return; }
    perfectSquare
      .metaData({ data: { info:perfectSquareData.info } })
      .selectedChartKey(selectedChartKey)
      .selectedQuadrantIndex(selectedQuadrantIndex)
      .selectedMeasureKey(selectedMeasureKey)
      .zoomK(zoomTransform.k)
      .arrangeBy(arrangeBy);

  }, [!perfectSquareData, perfectSquare, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey, zoomTransform?.k, arrangeBy])

  //apply handlers
  useEffect(() => {
    perfectSquare
        .setSelectedChartKey((chartD : PositionedDatapoint) => {
          zoomTo(chartD, 
            () => setSelectedChartKey(chartD.key));
        }) 
        .setSelectedMeasureKey(setSelectedMeasureKey);

  },[perfectSquare, setSelectedChartKey, zoomTo, setSelectedMeasureKey, data?.key])
  
  //main render/update visual
  useEffect(() => {
    if (!perfectSquareData) { return; }
    //call charts
    renderCharts.call(contentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
      transitions:{ enter: CHART_IN_TRANSITION, exit:CHART_OUT_TRANSITION }
    });
  }, [perfectSquare, perfectSquareData]);

  //update due to arrangeBy changing
  //flag to prevent the zoom useEffect running when sim changes the zoom functions eg isChartOnScreenChecker
  const simulationHasBeenToggledRef = useRef(false);
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    if(simulationIsOn){
      d3.select(contentsGRef.current).selectAll(".chart").call(perfectSquare)
    }else{
      //@todo - add transition to size of charts
      renderCharts.call(contentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
        transitions:{ update: { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION }}
      });
    }
    simulationHasBeenToggledRef.current = true;

  }, [perfectSquare, simulationIsOn]);

  //zooming in progress flag - note that dom will update due to zoom state changes
  useEffect(() => {
    perfectSquare.zoomingInProgress(zoomingInProgress);
  }, [perfectSquare, zoomingInProgress]);

  //update due to zoom
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    if(simulationHasBeenToggledRef.current){ return; }
    const datapointsOnScreen = perfectSquareData.datapoints.filter(d => isChartOnScreenChecker(d))
    //call charts, with no transitions
    renderCharts.call(contentsGRef.current, datapointsOnScreen, perfectSquare, simulationIsOn);
  }, [perfectSquare, isChartOnScreenChecker]);

  //light update for settings changes (the changes are added in an earlier useEffect)
  useEffect(() => {
    d3.select(contentsGRef.current).selectAll(".chart").call(perfectSquare)
  }, [perfectSquare, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey]);

  //Selected measure change
  useEffect(() => {
    if(selectedMeasureKey){
      setChartsViewboxTooltipsData([SELECT_MEASURE_TOOLTIP])
      //remove after 3 secs
      setTimeout(() => { 
        setChartsViewboxTooltipsData([]); 
        setSelectedMeasureKey("");
      }, 3000)
    }
  }, [selectedMeasureKey])


  useEffect(() => {
    //reset flags
    simulationHasBeenToggledRef.current = false;
  }, [simulationIsOn]);
  
  return (
    <>
      <g className="perfect-square-contents" ref={contentsGRef}></g>
    </>
  )
}

export default PerfectSquare;


