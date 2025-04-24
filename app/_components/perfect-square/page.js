/* eslint react-hooks/exhaustive-deps: 0 */
//@todo - remove the 2 or 3 places where this disbalong is needed. They are due to the need to prevent
//duplicate re-renders to the _svgComponents, but can be refactored to remove the need
//to pass in some settings within the useEffects that we dont want to be triggered

'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import * as d3 from 'd3';
import { AppContext } from "@/app/context";
import { VisualContext } from "../visual/context";
import { SVGContainerContext } from '../visual/SVGVisual/container';
import { ZoomContext } from '../visual/SVGVisual/hooks_and_modules/zoomable-g/page';
import perfectSquareLayout from './svgComponents/perfectSquare/layout';
import perfectSquareComponent from "./svgComponents/perfectSquare/component";
import renderCharts from './hooks_and_modules/renderCharts';
import { DEFAULT_DISPLAY_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants.js";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';
import { useSimulation } from '../visual/SVGVisual/hooks_and_modules/simulation/simulation';
import { useDataChangeManagement } from '../utility/dataChangeManagement';


/**
 * @description  Receives the data, passes it through various hooks and handles the 
 * the rendering and updating of the perfectSquare component via useEffects. Also maintains the state of the visual
 * based on callbacks from the component after user interactions.
 *
 * @param {object} data contains the datapoints which will become charts, the measures to be displayed, and some metadata
 * @param {object} initSelections contains three strings that represent any selections that should be applied to the initial render
 * @param {object} initSimulationSettings contains any initial settings that determine what simulation, if any, is on
 * @param {boolean} loading a flag to show if data is still loading
 * 
 * @returns {HTMLElement} A div that wraps VisualHeader component and an svg. The svg contains a g for the zoom 
 * that is applied in a useEffect, and a g which contains the charts whcih are rendered in a useEffect.
 */

//@todo - change to width and height because this fits the design pattern: each compponent is doesnt care about higher up the chain
const PerfectSquare = () => {
  const { visualData:{ data, loading, error }={} } = useContext(AppContext);
  const { 
    selectedChartKey, selectedQuadrantIndex, selectedMeasureKey,
    setSelectedChartKey, setSelectedQuadrantIndex, setSelectedMeasureKey,
    displaySettings: { arrangeBy }
  } = useContext(VisualContext);

  const { 
      container: { contentsWidth, contentsHeight }, 
      grid,
      chart,
  } = useContext(SVGContainerContext);

  const { 
    zoomTransformState, 
    zoomingInProgress, 
    zoomTo, 
    resetZoom, 
    isChartOnScreenChecker 
   } = useContext(ZoomContext);

  //dom refs
  const contentsGRef = useRef(null);

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
    prevDataKeyRef.current = data?.key;
  }, [data?.key])

  //issue is layout isnt always applied
  const perfectSquareData = useMemo(() => perfectSquareLayout(data, { grid }), 
    [data, JSON.stringify(grid)]);

  //simulation - turns on when user selects an 'arrangeBy' setting
  const simulationData = { nodesData:perfectSquareData?.datapoints || [], info:perfectSquareData?.info || {} }
  const { 
    simulationIsOn, 
    simulationHasBeenTurnedOnOrOff 
  } = useSimulation(contentsGRef, simulationData);

  //CHART
  //initialise the main vis component
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);

  //CHARTS RELATED USE-EFFECTS
  const dataIsNull = data === null;
  //apply dimensions
  useEffect(() => {
    if(dataIsNull || !chart){ return; }
    //console.log("uE 1")
    perfectSquare
      .width(chart.width)
      .height(chart.height)
      .margin(chart.margin);

  }, [dataIsNull, chart?.width, chart?.height, chart?.margin])
  
  //apply settings
  useEffect(() => {
    if(dataIsNull){ return; }
    //console.log("uE 2")
    perfectSquare
      .metaData({ data: { info:perfectSquareData?.info } })
      .selectedChartKey(selectedChartKey)
      .selectedQuadrantIndex(selectedQuadrantIndex)
      .selectedMeasureKey(selectedMeasureKey)
      .zoomK(zoomTransformState.k)
      .arrangeBy(arrangeBy);

  }, [dataIsNull, perfectSquare, perfectSquareData?.info, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey, zoomTransformState?.k, arrangeBy])

  //apply handlers
  useEffect(() => {
    //console.log("uE 3")
    perfectSquare
        .setSelectedChartKey(chartD => {
          zoomTo(chartD, 
            () => setSelectedChartKey(chartD.key));
        }) 
        .setSelectedMeasureKey(setSelectedMeasureKey);

  },[perfectSquare, setSelectedChartKey, zoomTo, setSelectedMeasureKey, data?.key])
  
  //main render/update visual
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    console.log("uE 4")
    //call charts
    renderCharts.call(contentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
      transitions:{ enter: CHART_IN_TRANSITION, exit:CHART_OUT_TRANSITION }
    });
  //@todo - find a better way to handle simulationIsOn...we dont want it to trigger this useEffect because
  //the next one handles changes to simultionIsOn, but atm we still want to pass it to renderCharts
  }, [contentsWidth, contentsHeight, perfectSquare, perfectSquareData]);

  //update due to arrangeBy changing
  //flag to prevent the zoom useEffect running when sim changes the zoom functions eg isChartOnScreenChecker
  const simulationHasBeenToggledRef = useRef(false);
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    console.log("uE 5", simulationIsOn)
    if(simulationIsOn){
      d3.select(contentsGRef.current).selectAll(".chart").call(perfectSquare)
    }else{
      //@todo - add transition to size of charts
      renderCharts.call(contentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
        transitions:{ update: { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION }}
      });
    }
    simulationHasBeenToggledRef.current = true;
    //prevSimulationStateRef.current = simulationIsOn ? "on" : "off";

  }, [perfectSquare, simulationIsOn]);

  //zooming in progress flag - note that dom will update due to zoom state changes
  useEffect(() => {
    //console.log("uE 6")
    perfectSquare.zoomingInProgress(zoomingInProgress);
  }, [perfectSquare, zoomingInProgress]);

  //update due to zoom
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    console.log("uE 7")
    if(simulationHasBeenToggledRef.current){
      console.log("ignoring zoom useEff as it is due to sim toggle")
      return;
    }
    const datapointsOnScreen = perfectSquareData.datapoints.filter(d => isChartOnScreenChecker(d))
    //call charts, with no transitions
    renderCharts.call(contentsGRef.current, datapointsOnScreen, perfectSquare, simulationIsOn);
  }, [perfectSquare, isChartOnScreenChecker]);

  //light update for settings changes (the changes are added in an earlier useEffect)
  useEffect(() => {
    //console.log("uE 8")
    d3.select(contentsGRef.current).selectAll(".chart").call(perfectSquare)
  }, [perfectSquare, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey]);


  useEffect(() => {
    //reset flags
    simulationHasBeenToggledRef.current = false;
  }, [simulationIsOn]);
  
  return (
    <g className="perfect-square-contents" ref={contentsGRef}></g>
  )
}

export default PerfectSquare;


