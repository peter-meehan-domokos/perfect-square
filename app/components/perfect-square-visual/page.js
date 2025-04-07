/* eslint react-hooks/exhaustive-deps: 0 */

'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3';
import PerfectSquareHeader from './header/page';
import perfectSquareLayout from './perfectSquareLayout';
import perfectSquareComponent from "./perfectSquareComponent";
import { renderCharts } from './d3RenderFunctions';
import { DEFAULT_SIMULATION_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants.js";
import { CHART_OUT_DURATION, ZOOM_AND_ARRANGE_TRANSITION_DURATION } from '@/app/constants';
import { useZoom } from './zoom';
import { useContainerDimensions } from './containerDimensions';
import { useGrid } from './grid'
import { useTooltips } from './useTooltips';
import { useSimulation } from './simulation';
//@todo - move state into Redux or useContext
//@todo - try putting curretnX, or an _x accessro on each d in here....do these ds themselves get mutated
  //by the sim. if not, we need to start recognising teh difference between data that has been through the layout,
  //and data that has then been binded to the dom and may be mutated by d3, so theres 3 layers of data, not just 2

//next - finsih what i started - i moved settings into simulation, so rpevArrageByRef is th3re too, and so on, must get it working
//need to move teh setting of prevArranegBy maybe or maybe not, as it can still be updated in te main render
/*
issues
 - flash at the start of render
 - there is some slight ovement at teh end of a zoom when a quad is selected
 - the newly on screen charts at teh end of reset zoom appear late you can see them render
 unless its others -> need o check teh checker is actually working aswell

 - need to check im not passing stuff to hooks that are coupled to tehe perfectsquare visual eg perfectSquare component

 - sort out filenaming ..should they all be useSimulation, or remove use form tooltips one. also folder for hooks and another for d4components like tooltip and pefectSqaure?
*/

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
  //set up the vis component
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);
  //dom refs
  const containerDivRef = useRef(null);
  const visContentsGRef = useRef(null);
  const viewGRef = useRef(null);

  //other data that doesnt trigger re-renders
  const cleanupInProgressRef = useRef(false);

  const [visData, setVisData] = useState(null);
  //@todo destructure, but check it doesnt affect the app elsewhere, as we will need to set visData to be {} not null
  //const { datapoints, info } = visData
  console.log("visData", visData?.key, visData?.datapoints?.length)
  const containerDimns = useContainerDimensions(containerDivRef);
  const { width, height, margin, contentsWidth, contentsHeight } = containerDimns;

  const grid = useGrid(contentsWidth, contentsHeight, visData?.datapoints?.length);
  const { cellWidth, cellHeight, cellMargin } = grid;

  //state
  const [headerExtended, setHeaderExtended] = useState(false);
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(initSelectedQuadrantIndex);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);
  
  //layout applied to data
  const perfectSquareData = useMemo(() => perfectSquareLayout(visData, { grid }), 
    [visData, JSON.stringify(grid)]);

  //simulation
  //issue - sim needs the prefectsquaredata as it has the metainfo eg mean, but layout needs to know if sim is on!
  //change data to { nodesData, info }
  const simulationData = { nodesData:perfectSquareData?.datapoints || [], info:perfectSquareData?.info || {} }
  const { simulationSettings, setSimulationSettings, nodeWidth, nodeHeight, simulationIsOn, prevArrangeByRef } = useSimulation(containerDivRef, simulationData, contentsWidth, contentsHeight, cellWidth, cellHeight, initSimulationSettings)
  const { arrangeBy } = simulationSettings;

  //some derived properties and functions  
  //chart dimns and position accessors - use node sizes if arrangement simulation is on
  const chartWidth = simulationIsOn ? nodeWidth : cellWidth;
  const chartHeight = simulationIsOn ? nodeHeight : cellHeight;
  const chartMargin = cellMargin;
  const _chartX = simulationIsOn ? d => d.x : d => d.cellX;
  const _chartY = simulationIsOn ? d => d.y : d => d.cellY;
  const { key, title, desc, info, categories, datapoints } = visData || {}
  const headerData = { key, title, categories, desc, info, nrDatapoints:datapoints?.length }

  //zoom
  const onZoomStart = () => { setSelectedChartKey(""); }
  const { zoomTransformState, zoomTo, resetZoom } = useZoom(containerDivRef, viewGRef, containerDimns, chartWidth, chartHeight, perfectSquare, _chartX, _chartY, onZoomStart);

  const { setHeaderTooltipsData, setChartsViewboxTooltipsData, setLoadingData } = useTooltips(containerDivRef, width, height);

  //loading tooltip
  useEffect(() => {
    setLoadingData(loading ? [LOADING_TOOLTIP] : []);
  },[loading])

  //data change/load
  useEffect(() => {
    //reset perfectSquare component if required
    const cleanupNeeded = visContentsGRef.current && !d3.select(visContentsGRef.current).selectAll(".chart").empty() && !cleanupInProgressRef.current;
    if(cleanupNeeded){
      cleanupInProgressRef.current = true;
      dataWaitingRef.current = data;
      setTimeout(() => {
        setSelectedQuadrantIndex(null);
        setSelectedChartKey("");
        setSelectedMeasureKey("");
        resetZoom(false);
        cleanupInProgressRef.current = false;
        //load the waiting data
        const dataToRender = dataWaitingRef.current;
        dataWaitingRef.current = null;
        setSizesAndTriggerDataRendering(dataToRender);

      }, CHART_OUT_DURATION);
    }else if(cleanupInProgressRef.current){
      //update dataWaiting to the latest
      dataWaitingRef.current = data;
    }else{
      //safe to load new data immediately
      //setSizesAndTriggerDataRendering(data);
      setVisData(data);
    }
  },[data.key])


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


