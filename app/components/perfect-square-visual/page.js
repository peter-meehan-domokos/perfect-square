/* eslint react-hooks/exhaustive-deps: 0 */

'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as d3 from 'd3';
import PerfectSquareHeader from './header/page';
import perfectSquareLayout from './perfectSquareLayout';
import perfectSquareComponent from "./perfectSquareComponent";
import tooltipComponent from "../d3HelperComponents/tooltipComponent";
import { renderCharts, renderTooltips } from './d3RenderFunctions';
import { DEFAULT_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP } from "./constants.js";
import { CHART_OUT_DURATION, ZOOM_AND_ARRANGE_TRANSITION_DURATION } from '@/app/constants';
import { isArranged } from './helpers';
import { setupSimulation } from './simulation';
import { useZoom } from './zoom';
import { useContainerDimensions } from './containerDimensions';
import { useGrid } from './grid'

//@todo - move state into Redux or useContext
//@todo - turn simulation and zoom into complete hooks instead of helper functions

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
const PerfectSquareVisual = ({ data={ datapoints:[], info:{ } }, initSelections={}, initSettings=DEFAULT_SETTINGS, loading=true }) => {
  //console.log("PerfectSquare key", data.key)
  const { initSelectedChartKey="", initSelectedMeasureKey="", initSelectedQuadrantIndex=null } = initSelections;

  //set up the vis components
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);
  const tooltip = useMemo(() => tooltipComponent(), []);
  //refs
  const isFirstRenderRef = useRef(true);
  const containerDivRef = useRef(null);
  const visContentsGRef = useRef(null);
  const viewGRef = useRef(null);
  const simRef = useRef(null);
  const simIsStartedRef = useRef(false);
  //other data that doesnt trigger re-renders
  const sizesRef = useRef(null);
  const perfectSquareDataRef = useRef(null);
  const cleanupInProgressRef = useRef(false);
  const simTicksInProcessRef = useRef(false);
  const prevArrangeByRef = useRef(null);

  const [visData, setVisData] = useState(null);
  //console.log("visData.key nrDatapoints", visData?.key, visData?.datapoints?.length)
  const containerDimns = useContainerDimensions(containerDivRef);
  const { width, height, margin, contentsWidth, contentsHeight } = containerDimns;
  //console.log("containerDimns", containerDimns)
  const grid = useGrid(contentsWidth, contentsHeight, visData?.datapoints?.length);
  const { cellWidth, cellHeight, cellMargin } = grid;
  //console.log("grid", grid)

  //state
  const [headerExtended, setHeaderExtended] = useState(false);
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(initSelectedQuadrantIndex);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);
  const [settings, setSettings] = useState(initSettings || DEFAULT_SETTINGS)
  const [headerTooltipsData, setHeaderTooltipsData] = useState([]);
  //const [chartsViewboxTooltipsData, setChartsViewboxTooltipsData] = useState([]);

  //zoom
  const { arrangeBy } = settings;
  const dataIsArranged = isArranged(arrangeBy);
  const onZoomStart = () => { setSelectedChartKey(""); }
  //chart dimns and position accessors
  //@todo - call the full reudction function here instead of 0.7 *
  const chartWidth = dataIsArranged ? 0.7 * cellWidth : cellWidth;
  const chartHeight = dataIsArranged ? 0.7 * cellHeight : cellHeight;
  const chartMargin = cellMargin;
  const _chartX = dataIsArranged ? d => d.x : d => d.cellX;
  const _chartY = dataIsArranged ? d => d.y : d => d.cellY;

  const { zoomTransformState, zoomTo, resetZoom } = useZoom(containerDivRef, viewGRef, containerDimns, chartWidth, chartHeight, perfectSquare, _chartX, _chartY, onZoomStart);

  const { key, title, desc, info, categories, datapoints } = data

  const headerData = {
    key,
    title,
    categories,
    desc,
    info,
    nrDatapoints:datapoints.length
  }

  const loadingData = loading ? [LOADING_TOOLTIP] : [];

  //helper to set sizes
  /**
 * Outputs the event that happened
 *
 * @param {MyEvent} e - The observable event.
 * @listens ResizeEvent - The visual container dimensions change, eg when the user adjusts the window, or presses the 'show description' button (on smaller screens)
 */


  //data change/load
  useEffect(() => {
    //if (isFirstRenderRef.current) { return; }
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
      console.log("setting visData to.....", data)
      setVisData(data);
    }
  },[data.key])

  /*useEffect(() => {
    console.log("init mount")
  },[])

  const initDone = useMemo(() => {
    console.log("check init done")
    return true;
  }, []);*/

  //layout applied to data
  //@todo - try putting curretnX, or an _x accessro on each d in here....do these ds themselves get mutated
  //by the sim. if not, we need to start recognising teh difference between data that has been through the layout,
  //and data that has then been binded to the dom and may be mutated by d3, so theres 3 layers of data, not just 2
  const perfectSquareData = useMemo(() => perfectSquareLayout(visData, { grid, dataIsArranged }), 
    [visData, JSON.stringify(grid), dataIsArranged]);

  //console.log("perfectSquareData key selchart", perfectSquareData?.key, selectedChartKey)
  //simulation
  /*
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    const { chartWidth, chartHeight } = sizesRef.current;
    if(!dataIsArranged){ return; }

    const perfectSquareData = perfectSquareDataRef.current;
    const perfectSquareDatapoints = perfectSquareData.datapoints;
  
    //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
    const dataWasAlreadyArranged = isArranged(prevArrangeByRef.current);
    if(!dataWasAlreadyArranged){
      perfectSquareDatapoints.forEach(d => {
        d.x = d.cellX;
        d.y = d.cellY;
      })
    }

    simRef.current = d3.forceSimulation(perfectSquareDatapoints);
    setupSimulation(simRef.current, contentsWidth, contentsHeight, chartWidth, chartHeight, arrangeBy, nrDatapoints, perfectSquareData.info);

    simRef.current
      .on("tick", () => {
        if(!simTicksInProcessRef.current){ simTicksInProcessRef.current = true; }
        if(!simIsStartedRef.current){ return; }
        d3.select(containerDivRef.current).select("g.viz-contents").selectAll("g.chart")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
      })
      .on("end", () => { simTicksInProcessRef.current = false; })

  }, [contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])

  //start/stop sim
  useEffect(() => {
    if(!dataIsArranged){
      simRef.current?.stop();
      simIsStartedRef.current = false;
    }else{
      simRef.current?.restart();
      simIsStartedRef.current = true;
    }
  },[arrangeBy])
  */

  //apply dimensions
  useEffect(() => {
    perfectSquare
      .width(chartWidth)
      .height(chartHeight)
      .margin(chartMargin);

  }, [chartWidth, chartHeight, chartMargin])
  
  //apply settings
  useEffect(() => {
    console.log("settings useEff", selectedChartKey)
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
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    const arrangementHasChanged = prevArrangeByRef.current !== arrangeBy;

    //position the contentsG
    d3.select(visContentsGRef.current).attr("transform", `translate(${margin.left}, ${margin.top})`);

    //call charts
    console.log("fullrender/update")
    renderCharts.call(visContentsGRef.current, perfectSquareData.datapoints, perfectSquare, dataIsArranged, {
      updateTransformTransition: arrangementHasChanged ? { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION } : null
    });

    //update flag for transition
    prevArrangeByRef.current = arrangeBy;

  }, [contentsWidth, contentsHeight, chartWidth, chartHeight, chartMargin, perfectSquare, perfectSquareData, arrangeBy])

  //light update for settings changes - the changes are added separately beforehand - see useEffect higher up
  //@todo - check whether this is optial as we are trigerring an update even though the useEffect itself doesnt use these settings 
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    console.log("light update")
    d3.select(visContentsGRef.current).selectAll(".chart").call(perfectSquare)
  }, [selectedChartKey, selectedQuadrantIndex, selectedMeasureKey])

  //render/update tooltips
  /*
  useEffect(() => {
    const tooltipsData = [
      ...headerTooltipsData, 
      ...chartsViewboxTooltipsData,
      ...loadingData
    ];
    renderTooltips.call(containerDivRef.current, tooltipsData, tooltip, width, height);
  }, [width, headerTooltipsData, chartsViewboxTooltipsData, loadingData])
  */

  /*

  //Selected measure change
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    //for now, just show a tooltip
    if(selectedMeasureKey){
      setChartsViewboxTooltipsData([SELECT_MEASURE_TOOLTIP])
      setTimeout(() => { 
        setChartsViewboxTooltipsData([]); 
        setSelectedMeasureKey("");
      }, 3000)
    }
  }, [selectedMeasureKey])
  */

  useEffect(() => { isFirstRenderRef.current = false; })

  return (
    <div className="viz-root">
      <PerfectSquareHeader 
        data={headerData} 
        settings={settings}
        zoomTransform={zoomTransformState}
        headerExtended={headerExtended} 
        setHeaderExtended={setHeaderExtended} 
        selectedQuadrantIndex={selectedQuadrantIndex}
        setSelectedQuadrantIndex={setSelectedQuadrantIndex}
        setSettings={setSettings}
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


