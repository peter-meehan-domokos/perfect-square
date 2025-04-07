/* eslint react-hooks/exhaustive-deps: 0 */

'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as d3 from 'd3';
import PerfectSquareHeader from './header/page';
import perfectSquareLayout from './perfectSquareLayout';
import perfectSquareComponent from "./perfectSquareComponent";
import { renderCharts } from './d3RenderFunctions';
import { DEFAULT_SIMULATION_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants.js";
import { ZOOM_AND_ARRANGE_TRANSITION_DURATION } from '@/app/constants';
import { useZoom } from './zoom';
import { useContainerDimensions } from './containerDimensions';
import { useGrid } from './grid'
import { useTooltips } from './useTooltips';
import { useSimulation } from './simulation';
import { useDataChangeManagement } from './data-change-management';

/**
 * @description  Prepares the data by passing it through the layout function, maintains the state of the visual
 * which is adjusted via event-driven callbacks (eg changes to zoom or to the simulation), and makes calls to the 
 * main render function upon any state changes, passing it the container dom element, and new data if required.
 *
 * @param {object} data contains the datapoints which will become charts, the measures to be displayed, and some metadata
 * @param {object} initSelections contains three strings that represent any selections that should be applied to the initial render
 * @param {object} initSettings contains any initial settings that should be applied to the visual before initial render
 * @param {boolean} loading a flag to show if data is still loading
 * 
 * @returns {HTMLElement} A div that wraps VisualHeader component and an svg. The svg contains a g for the zoom 
 * that is applied in a useEffect, and a g which contains the charts whcih are rendered in a useEffect.
 */
const PerfectSquareVisual = ({ data={ datapoints:[], info:{ } }, initSelections={}, initSimulationSettings=DEFAULT_SIMULATION_SETTINGS, loading=true }) => {
  const { initSelectedChartKey="", initSelectedMeasureKey="", initSelectedQuadrantIndex=null } = initSelections;
  //header state - can be extended on smaller screens where it is not displayed in full
  const [headerExtended, setHeaderExtended] = useState(false);
  //selection state
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(initSelectedQuadrantIndex);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);

  //dom refs
  const containerDivRef = useRef(null);
  const visContentsGRef = useRef(null);
  const viewGRef = useRef(null);

  //managedData - control the way that a complete change of data is handled
  const cleanup = () => {
    setSelectedChartKey("");
    setSelectedQuadrantIndex(null);
    setSelectedMeasureKey("");
    if(resetZoom){ resetZoom(false); } //needs a guard as not defined till further down
  }
  const { managedData } = useDataChangeManagement(visContentsGRef, data, cleanup);
  const { key, title, desc, info, categories, datapoints } = managedData;

  //container dimensions
  const containerDimns = useContainerDimensions(containerDivRef);
  const { width, height, margin, contentsWidth, contentsHeight } = containerDimns;

  //grid - the default display
  const grid = useGrid(contentsWidth, contentsHeight, managedData?.datapoints?.length);
  const { cellWidth, cellHeight, cellMargin } = grid;
  
  //layout function - puts data into format expected by perfectSquare component
  const perfectSquareData = useMemo(() => perfectSquareLayout(managedData, { grid }), 
    [managedData, JSON.stringify(grid)]);

  //simulation - turns on when user selects an 'arrangeBy' setting
  const simulationData = { nodesData:perfectSquareData?.datapoints || [], info:perfectSquareData?.info || {} }
  const { simulationSettings, setSimulationSettings, nodeWidth, nodeHeight, simulationIsOn, prevArrangeByRef } = useSimulation(containerDivRef, simulationData, contentsWidth, contentsHeight, cellWidth, cellHeight, initSimulationSettings)
  const { arrangeBy } = simulationSettings;

  //chart dimns and position accessors - use node sizes if arrangement simulation is on
  const chartWidth = simulationIsOn ? nodeWidth : cellWidth;
  const chartHeight = simulationIsOn ? nodeHeight : cellHeight;
  const chartMargin = cellMargin;
  const _chartX = simulationIsOn ? d => d.x : d => d.cellX;
  const _chartY = simulationIsOn ? d => d.y : d => d.cellY;

  //data for the Header component
  const headerData = { key, title, categories, desc, info, nrDatapoints:datapoints?.length }

  //main vis component
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);

  //zoom
  const onZoomStart = () => { setSelectedChartKey(""); }
  const { zoomTransformState, zoomTo, resetZoom } = useZoom(containerDivRef, viewGRef, containerDimns, chartWidth, chartHeight, perfectSquare, _chartX, _chartY, onZoomStart);

  //tooltips
  const { setHeaderTooltipsData, setChartsViewboxTooltipsData, setLoadingData } = useTooltips(containerDivRef, width, height);
  //loading tooltip
  useEffect(() => {
    setLoadingTooltipsData(loading ? [LOADING_TOOLTIP] : []);
  },[loading])

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

  }, [perfectSquareData?.info, selectedChartKey, selectedQuadrantIndex, selectedMeasureKey, zoomTransformState?.k, arrangeBy])
  
  //apply handlers
  useEffect(() => {
    perfectSquare
        .setSelectedChartKey(chartD => {
          zoomTo(chartD, 
            () => setSelectedChartKey(chartD.key));
        })
        .setSelectedMeasureKey(setSelectedMeasureKey);

  }, [setSelectedChartKey, zoomTo, setSelectedMeasureKey])
  
  //render/update visual
  useEffect(() => {
    if (!perfectSquareData) { return; }
    const arrangementHasChanged = prevArrangeByRef.current !== arrangeBy;

    //position the contentsG
    d3.select(visContentsGRef.current).attr("transform", `translate(${margin.left}, ${margin.top})`);

    //call charts
    console.log("fullrender/update")
    renderCharts.call(visContentsGRef.current, perfectSquareData.datapoints, perfectSquare, simulationIsOn, {
      updateTransformTransition: arrangementHasChanged ? { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION } : null
    });

    //update flag for transition
    prevArrangeByRef.current = arrangeBy;

  }, [contentsWidth, contentsHeight, chartWidth, chartHeight, chartMargin, perfectSquare, perfectSquareData, arrangeBy])

  //light update for settings changes (the changes are added in an earlier useEffect)
  useEffect(() => {
    console.log("light update")
    d3.select(visContentsGRef.current).selectAll(".chart").call(perfectSquare)
  }, [selectedChartKey, selectedQuadrantIndex, selectedMeasureKey])


  //Selected measure change
  useEffect(() => {
    //for now, just show a tooltip
    if(selectedMeasureKey){
      setChartsViewboxTooltipsData([SELECT_MEASURE_TOOLTIP])
      setTimeout(() => { 
        setChartsViewboxTooltipsData([]); 
        setSelectedMeasureKey("");
      }, 3000)
    }
  }, [selectedMeasureKey])

  return (
    <div className="viz-root">
      <PerfectSquareHeader 
        data={headerData} 
        settings={simulationSettings}
        zoomTransform={zoomTransformState}
        headerExtended={headerExtended} 
        setHeaderExtended={setHeaderExtended} 
        selectedQuadrantIndex={selectedQuadrantIndex}
        setSelectedQuadrantIndex={setSelectedQuadrantIndex}
        setSettings={setSimulationSettings}
        resetZoom={resetZoom}
        setTooltipsData={setHeaderTooltipsData}
      />
      <div className={`viz-container ${headerExtended ? "with-extended-header" : ""}`} >
        <div className="viz-inner-container" ref={containerDivRef}>
          <svg className="viz" width="100%" height="100%" >
            <g ref={viewGRef}>
              <g className="viz-contents" ref={visContentsGRef}></g>
            </g>
            <defs>
              <clipPath id="slide-tooltip-clip">
                <rect></rect>
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default PerfectSquareVisual;


