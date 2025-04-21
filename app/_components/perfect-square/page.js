/* eslint react-hooks/exhaustive-deps: 0 */
//@todo - remove the 2 or 3 places where this disbalong is needed. They are due to the need to prevent
//duplicate re-renders to the _svgComponents, but can be refactored to remove the need
//to pass in some settings within the useEffects that we dont want to be triggered

'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react'
import * as d3 from 'd3';
import { AppContext } from "@/app/context";
import { VisualContext } from "../visual/context";
import { ZoomContext } from '../visual/SVGVisual/hooks_and_modules/zoomable-g/page';
import perfectSquareLayout from './svgComponents/perfectSquare/layout';
import perfectSquareComponent from "./svgComponents/perfectSquare/component";
import renderCharts from './hooks_and_modules/renderCharts';
import { DEFAULT_SIMULATION_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants.js";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';
import { useSimulation } from './hooks_and_modules/simulation';

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
const PerfectSquare = ({ contentsWidth, contentsHeight, grid }) => {
  //@todo - remove the ={} once we have a loadingFallback
  const { visualData:{ data }={} } = useContext(AppContext);
  const { 
    selectedChartKey, selectedQuadrantIndex, selectedMeasureKey,
    setSelectedChartKey, setSelectedQuadrantIndex, setSelectedMeasureKey,
  } = useContext(VisualContext);

  const { 
    zoomTransformState, 
    //zoomingInProgress, 
    zoomTo, 
    //resetZoom, 
    //isChartOnScreenChecker 
   } = useContext(ZoomContext);

  const { cellWidth, cellHeight, cellMargin } = grid || {};

  //dom refs
  const contentsGRef = useRef(null);
  
  //next - datapoints dont seem tohave stuff added..is the layout even running?
  //layout function - puts data into format expected by perfectSquare component
  const perfectSquareData = useMemo(() => perfectSquareLayout(data, { grid }), 
    [data, JSON.stringify(grid)]);

  //simulation - turns on when user selects an 'arrangeBy' setting
  /*const simulationData = { nodesData:perfectSquareData?.datapoints || [], info:perfectSquareData?.info || {} }
  const { simulationSettings, setSimulationSettings, nodeWidth, nodeHeight, simulationIsOn, simulationHasBeenTurnedOnOrOff } = useSimulation(contentsGRef, simulationData, contentsWidth, contentsHeight, cellWidth, cellHeight, initSimulationSettings)
  const { arrangeBy } = simulationSettings;*/
  const simulationIsOn = false;

  //chart dimns and position accessors - use node sizes if simulation is on (ie arrangeBy has been set)
  const chartWidth = simulationIsOn ? nodeWidth : cellWidth;
  const chartHeight = simulationIsOn ? nodeHeight : cellHeight;
  const chartMargin = cellMargin;
  const _chartX = simulationIsOn ? d => d?.x : d => d?.cellX;
  const _chartY = simulationIsOn ? d => d.y : d => d.cellY;

  //CHART
  //initialise the main vis component
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);

  //CHARTS RELATED USE-EFFECTS
  //@todo - consider putting all of these into a useCharts useEffect
  //apply dimensions
  useEffect(() => {
    perfectSquare
      .width(chartWidth)
      .height(chartHeight)
      .margin(chartMargin);

  }, [chartWidth, chartHeight, chartMargin])
  
  //apply settings
  useEffect(() => {
    perfectSquare
      .metaData({ data: { info:perfectSquareData?.info } })
      .selectedChartKey(selectedChartKey)
      .selectedQuadrantIndex(selectedQuadrantIndex)
      .selectedMeasureKey(selectedMeasureKey)
      .zoomK(zoomTransformState.k)
      //.arrangeBy(arrangeBy);

  }, [perfectSquare, perfectSquareData?.info, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey, zoomTransformState?.k/*, arrangeBy*/])

  //apply handlers
  useEffect(() => {
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
    //call charts
    renderCharts.call(contentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
      transitions:{ enter: CHART_IN_TRANSITION, exit:CHART_OUT_TRANSITION }
    });
  //@todo - find a better way to handle simulationIsOn...we dont want it to trigger this useEffect because
  //the next one handles changes ot simultionIsOn, but atm we still want to pass it to renderCharts
  }, [contentsWidth, contentsHeight, perfectSquare, perfectSquareData]);

  //light update for settings changes (the changes are added in an earlier useEffect)
  useEffect(() => {
    d3.select(contentsGRef.current).selectAll(".chart").call(perfectSquare)
  }, [perfectSquare, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey])
  
  return (
    <g className="perfect-square-contents" ref={contentsGRef}></g>
  )
}

export default PerfectSquare;


