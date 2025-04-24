/* eslint react-hooks/exhaustive-deps: 0 */
//@todo - remove the 2 or 3 places where this disbalong is needed. They are due to the need to prevent
//duplicate re-renders to the _svgComponents, but can be refactored to remove the need
//to pass in some settings within the useEffects that we dont want to be triggered

'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as d3 from 'd3';
import PerfectSquareHeader from '../visual/header/page';
import perfectSquareLayout from './svgComponents/perfectSquare/layout';
import perfectSquareComponent from "./svgComponents/perfectSquare/component";
import renderCharts from './hooks_and_modules/renderCharts';
import { DEFAULT_DISPLAY_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants.js";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION, CHART_IN_TRANSITION, CHART_OUT_TRANSITION } from '@/app/constants';
import { useZoom } from '../visual/SVGVisual/hooks_and_modules/zoomable-g/zoom';
import { useSVGContainerContext } from '../visual/SVGVisual/hooks_and_modules/containerDimensions';
import calcGrid from '../visual/SVGVisual/hooks_and_modules/grid'
import { useTooltips } from '../visual/SVGVisual/hooks_and_modules/tooltips/renderTooltips';
import { useSimulation } from '../visual/SVGVisual/hooks_and_modules/simulation/simulation';
import { useDataChangeManagement } from './hooks_and_modules/dataChangeManagement';

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
const PerfectSquare = ({ data={ datapoints:[], info:{ } }, initSelections={}, initSimulationSettings=DEFAULT_DISPLAY_SETTINGS, loading=true }) => {
  const { initSelectedChartKey="", initSelectedMeasureKey="", initSelectedQuadrantIndex=null } = initSelections;
  //selection state
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(initSelectedQuadrantIndex);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);

  //dom refs
  const containerDivRef = useRef(null);
  const visContentsGRef = useRef(null);
  const viewGRef = useRef(null);

  //managedData - control the way that a complete change of data is handled
  const cleanup = useCallback(() => {
    setSelectedChartKey("");
    setSelectedQuadrantIndex(null);
    setSelectedMeasureKey("");
    if(resetZoom){ resetZoom(false); } //needs a guard as not defined till further down
  //@todo - remove this disabling and find a better way to manage the fact that resetZoom is not yet defined
  }, [setSelectedChartKey, setSelectedQuadrantIndex, setSelectedMeasureKey, /*resetZoom*/]);

  const { managedData } = useDataChangeManagement(visContentsGRef, data, cleanup);
  const { key, title, desc, info, categories, datapoints } = managedData;

  //container dimensions
  const containerDimns = useSVGContainerContext(containerDivRef);
  const { width, height, margin, contentsWidth, contentsHeight } = containerDimns;

  //grid
  const grid = useMemo(() => calcGrid(contentsWidth, contentsHeight, managedData.datapoints?.length), 
    [contentsWidth, contentsHeight, managedData.datapoints?.length]);
  const { cellWidth, cellHeight, cellMargin } = grid;
  
  //layout function - puts data into format expected by perfectSquare component
  const perfectSquareData = useMemo(() => perfectSquareLayout(managedData, { grid }), 
    [managedData, JSON.stringify(grid)]);

  //simulation - turns on when user selects an 'arrangeBy' setting
  const simulationData = { nodesData:perfectSquareData?.datapoints || [], info:perfectSquareData?.info || {} }
  const { displaySettings, setDisplaySettings, nodeWidth, nodeHeight, simulationIsOn, simulationHasBeenTurnedOnOrOff } = useSimulation(containerDivRef, simulationData, contentsWidth, contentsHeight, cellWidth, cellHeight, initSimulationSettings)
  const { arrangeBy } = displaySettings;

  //chart dimns and position accessors - use node sizes if simulation is on (ie arrangeBy has been set)
  const chartWidth = simulationIsOn ? nodeWidth : cellWidth;
  const chartHeight = simulationIsOn ? nodeHeight : cellHeight;
  const chartMargin = cellMargin;
  const _chartX = simulationIsOn ? d => d?.x : d => d?.cellX;
  const _chartY = simulationIsOn ? d => d.y : d => d.cellY;

  //zoom
  const onZoomStart = () => { setSelectedChartKey(""); }
  const { zoomTransformState, zoomingInProgress, zoomTo, resetZoom, isChartOnScreenChecker } = useZoom(containerDivRef, viewGRef, containerDimns, chartWidth, chartHeight, _chartX, _chartY, onZoomStart);

  //tooltips
  const { setHeaderTooltipsData, setChartsViewboxTooltipsData, setLoadingTooltipsData } = useTooltips(containerDivRef, width, height);
  //set loading tooltip
  useEffect(() => { 
    setLoadingTooltipsData(loading ? [LOADING_TOOLTIP] : []); 
  },[loading, setLoadingTooltipsData])

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
      .arrangeBy(arrangeBy);

  }, [perfectSquare, perfectSquareData?.info, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey, zoomTransformState?.k, arrangeBy])
  
  //apply handlers
  useEffect(() => {
    perfectSquare
        .setSelectedChartKey(chartD => {
          zoomTo(chartD, 
            () => setSelectedChartKey(chartD.key));
        })
        .setSelectedMeasureKey(setSelectedMeasureKey);

  },[perfectSquare, setSelectedChartKey, zoomTo, setSelectedMeasureKey, managedData.key])
 
  //position the contentsG
  useEffect(() => {
    d3.select(visContentsGRef.current).attr("transform", `translate(${margin.left}, ${margin.top})`);
  }, [margin])
  
  //main render/update visual
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    //call charts
    renderCharts.call(visContentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
      transitions:{ enter: CHART_IN_TRANSITION, exit:CHART_OUT_TRANSITION }
    });
  //@todo - find a better way to handle simulationIsOn...we dont want it to trigegr this useEffect because
  //the next one handles changes ot simultionIsOn, but atm we still want to pass it to renderCharts
  }, [contentsWidth, contentsHeight, perfectSquare, perfectSquareData]);

  //update due to arrangeBy changing
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    //the issue now is when sim starts, they jump to teh position when the sim is beimg turned on for the 
    //2nd time, but not the first time, so need to clean up the sim
    //simplest thing is to just create a completely new sim each time? nd wipe x,y,dx,dy from each node?
    if(simulationIsOn){
      d3.select(visContentsGRef.current).selectAll(".chart").call(perfectSquare)
    }else{
      //@todo - add transition to size of charts
      renderCharts.call(visContentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
        transitions:{ update: { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION }}
      });
    }
    //call charts, smoothly transitioning the chart positions
  }, [perfectSquare, simulationIsOn])

  //zooming in progress flag - note that dom will update due to zoom state changes
  useEffect(() => {
    perfectSquare.zoomingInProgress(zoomingInProgress);
  }, [perfectSquare, zoomingInProgress])

  //update due to zoom
  useEffect(() => {
    if (!perfectSquareData || !perfectSquareData.datapoints) { return; }
    const datapointsOnScreen = perfectSquareData.datapoints.filter(d => isChartOnScreenChecker(d, zoomTransformState))
    //call charts, with no transitions
    renderCharts.call(visContentsGRef.current, datapointsOnScreen, perfectSquare, simulationIsOn);
  }, [perfectSquare, zoomTransformState, isChartOnScreenChecker]);

  //light update for settings changes (the changes are added in an earlier useEffect)
  useEffect(() => {
    d3.select(visContentsGRef.current).selectAll(".chart").call(perfectSquare)
  }, [perfectSquare, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey])


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

  return (
    <div className="vis-layout" ref={containerDivRef}>
      <svg className="viz" width="100%" height="100%" >
        <g ref={viewGRef}>
          <g className="vis-contents" ref={visContentsGRef}></g>
        </g>
        <defs>
          <clipPath id="slide-tooltip-clip">
            <rect></rect>
          </clipPath>
        </defs>
      </svg>
    </div>
  )
}

export default PerfectSquare;


