/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import React, { useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import * as d3 from 'd3';
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
  //flag
  const simulationHasBeenToggledOnOffRef = useRef(false);
  useEffect(() => {
    simulationHasBeenToggledOnOffRef.current = !simulationHasBeenToggledOnOffRef.current;
  }, [simulationIsOn])

  //apply dimensions
  useEffect(() => {
    if(!chart){ return; }

    perfectSquare
      .width(chart.width)
      .height(chart.height)
      .margin(chart.margin);

  }, [grid, simulationIsOn, perfectSquare])

  useEffect(() => {
    if(!grid){ return; }
    //use cell size to determine minlevel, as chart size reduces when simulation is on, but we dont want level to change for that
    perfectSquare.shouldUpdateMinLevelOfDetail(true);
  }, [grid?.cellWidth, grid?.cellHeight, perfectSquare])
  
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
    //console.log("call render from mainue...")
    renderCharts.call(containerElement, data.datapoints, perfectSquare, simulationIsOn, {
      transitions:{ enter: CHART_IN_TRANSITION, exit:CHART_OUT_TRANSITION }
    });
  }, [perfectSquare, data]);

  useEffect(() => {
    if (!data || !containerElement) { return; }
    if(simulationIsOn){
      //x,y provided by sim, so just call chart
      d3.select(containerElement).selectAll(".chart").call(perfectSquare)
    }else{
      renderCharts.call(containerElement, data.datapoints, perfectSquare, simulationIsOn, {
        transitions:{ update: { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION }}
      });
    }
  }, [perfectSquare, arrangeBy]);

  //zooming in progress flag in perfectSquareComponent - note that dom will update due to zoom state changes
  useEffect(() => {
    perfectSquare.zoomingInProgress(zoomingInProgress);
  }, [perfectSquare, zoomingInProgress]);

  //update due to zoom
  useEffect(() => {
    if (!data || !containerElement) { return; }
    //if isChartOnScreenChecker has updated due to sim, dont need to render charts here assim useEffect handles it
    if(simulationHasBeenToggledOnOffRef.current){ return; }
    //TOOK THIS OUT - not sure why i put it in, but it prevents manual zoom from processing isChartOnScreenChecker
    //if(!zoomingInProgress){ return; }

    const datapointsOnScreen = data.datapoints.filter(d => isChartOnScreenChecker(d))
    //call charts, with no transitions
    //console.log("call render from zoomue...")
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
    simulationHasBeenToggledOnOffRef.current = false;
  }, [simulationIsOn]);
  
  return null;
}

export default usePerfectSquareCharts;


