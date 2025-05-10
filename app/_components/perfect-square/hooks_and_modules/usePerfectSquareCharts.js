/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import React, { useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import * as d3 from 'd3';
import { PerfectSquareData } from '@/app/common-types/data-types';
import {  } from '@/app/common-types/function-types';
import { VisualContext } from "../../visual/context";
import { TooltipsContext } from '../../visual/SVGVisual/hooks_and_modules/tooltips/context';
import { SVGDimensionsContext } from '../../visual/SVGVisual/container';
import { ZoomContext } from '../../visual/SVGVisual/hooks_and_modules/zoomable-g/page';

import renderCharts from './renderCharts';
import { SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "../constants";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';

/**
 * @description  Receives the data and other state, passes it through functions to prepare teh data, 
 * and calls useEffects which pass in settings to the svg component (non-react), and renders/updates it.
 * 
 * @returns {ReactElement}  A g which will contain the charts which are rendered in a useEffect.
 */

const usePerfectSquareCharts = (containerElement, data, perfectSquare, simulationIsOn) => {
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
    if(!data){ return; }
    perfectSquare
      .metadata(data.metadata)
      .selectedChartKey(selectedChartKey)
      .selectedQuadrantIndex(selectedQuadrantIndex)
      .selectedMeasureKey(selectedMeasureKey)
      .zoomK(zoomTransform.k)
      .arrangeBy(arrangeBy);

  }, [!data, perfectSquare, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey, zoomTransform?.k, arrangeBy])

  //apply handlers
  useEffect(() => {
    perfectSquare
        .setSelectedChartKey((chartD) => {
          zoomTo(chartD, 
            () => setSelectedChartKey(chartD.key));
        }) 
        .setSelectedMeasureKey(setSelectedMeasureKey);

  },[perfectSquare, setSelectedChartKey, zoomTo, setSelectedMeasureKey, data?.key])
  
  //main render/update visual
  useEffect(() => {
    if (!data | !containerElement) { return; }
    //call charts
    renderCharts.call(containerElement, data.datapoints, perfectSquare, simulationIsOn, {
      transitions:{ enter: CHART_IN_TRANSITION, exit:CHART_OUT_TRANSITION }
    });
  }, [perfectSquare, data]);

  //update due to arrangeBy changing
  //flag to prevent the zoom useEffect running when sim changes the zoom functions eg isChartOnScreenChecker
  const simulationHasBeenToggledRef = useRef(false);
  
  useEffect(() => {
    if (!data || !containerElement) { return; }
    if(simulationIsOn){
      d3.select(containerElement).selectAll(".chart").call(perfectSquare)
    }else{
      //@todo - add transition to size of charts
      renderCharts.call(containerElement, data.datapoints, perfectSquare, simulationIsOn, {
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
    if (!data || !containerElement) { return; }
    if(simulationHasBeenToggledRef.current){ return; }
    const datapointsOnScreen = data.datapoints.filter(d => isChartOnScreenChecker(d))
    //call charts, with no transitions
    renderCharts.call(containerElement, datapointsOnScreen, perfectSquare, simulationIsOn);
  }, [perfectSquare, isChartOnScreenChecker]);

  //light update for settings changes (the changes are added in an earlier useEffect)
  useEffect(() => {
    if(!containerElement){ return; }
    d3.select(containerElement).selectAll(".chart").call(perfectSquare)
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
  
  return null;
}

export default usePerfectSquareCharts;


