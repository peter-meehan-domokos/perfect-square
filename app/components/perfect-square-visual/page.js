/* eslint react-hooks/exhaustive-deps: 0 */

'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as d3 from 'd3';
import PerfectSquareHeader from './header/page';
import perfectSquareLayout from './perfectSquareLayout';
import perfectSquareComponent from "./perfectSquareComponent";
import tooltipComponent from "../d3HelperComponents/tooltipComponent";
import { renderCharts, renderTooltips } from './d3RenderFunctions';
import { DEFAULT_SETTINGS, SELECT_MEASURE_TOOLTIP, LOADING_TOOLTIP, CONTAINER_MARGIN, CALC_CHART_MARGIN } from "./constants.js";
import { CHART_OUT_DURATION, ZOOM_AND_ARRANGE_TRANSITION_DURATION } from '@/app/constants';
import { isArranged, calcNrColsAndRows, calcChartSizesAndGridLayout, applyMargin, isChartOnScreenCheckerFunc, calcZoomTransformFunc } from './helpers';
import { getElementDimns } from '@/app/helpers/domHelpers';
import { setupSimulation } from './simulation';
import { setupZoom } from './zoom';

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
  const { initSelectedChartKey="", initSelectedMeasureKey="", initSelectedQuadrantIndex=null } = initSelections;

  //set up the vis components
  const perfectSquare = useMemo(() => perfectSquareComponent(), []);
  const tooltip = useMemo(() => tooltipComponent(), []);

  //state
  const [headerExtended, setHeaderExtended] = useState(false);
  const [containerSizesAndGrid, setContainerSizesAndGrid] = useState({});
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(initSelectedQuadrantIndex);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);
  const [settings, setSettings] = useState(initSettings || DEFAULT_SETTINGS)
  const [headerTooltipsData, setHeaderTooltipsData] = useState([]);
  const [chartsViewboxTooltipsData, setChartsViewboxTooltipsData] = useState([]);
  //zoom state is only used for React children ie Header
  const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity)

  const { width, height, margin, contentsWidth, contentsHeight, nrDatapoints, nrCols, nrRows, visKey } = containerSizesAndGrid;
  const { arrangeBy } = settings;
  const dataIsArranged = isArranged(arrangeBy);
  //refs
  const isFirstRenderRef = useRef(true);
  const containerDivRef = useRef(null);
  const visContentsGRef = useRef(null);
  const viewGRef = useRef(null);
  //store the actual zoom function so we can access its methods to get/set the transform
  const zoomRef = useRef(null);
  const simRef = useRef(null);
  const simIsStartedRef = useRef(false);
  //other data that doesnt trigger re-renders
  const sizesRef = useRef(null);
  const processedDataRef = useRef(null);
  const cleanupInProgressRef = useRef(false);
  const dataWaitingRef = useRef(null);
  const simTicksInProcessRef = useRef(false);
  const prevArrangeByRef = useRef(null);

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
  const setSizesAndTriggerDataRendering = useCallback((data) => {
    const setSizesAndGrid = () => {
      if(!containerDivRef.current){ return; }
      const { width, height } = getElementDimns.call(containerDivRef.current);
      const { contentsWidth, contentsHeight, margin } = applyMargin(width, height, CONTAINER_MARGIN)
      const nrDatapoints = data.datapoints.length;
      const { nrCols, nrRows } = !nrDatapoints ? { nrCols:1, nrRows:1 } : calcNrColsAndRows(contentsWidth, contentsHeight, nrDatapoints);
      //visKey helps control the triggering of dom updates in useEffects
      setContainerSizesAndGrid({ width, height, contentsWidth, contentsHeight, margin, nrCols, nrRows, nrDatapoints, visKey:data.key })
    }

    let resizeObserver = new ResizeObserver(() => { setSizesAndGrid(); }); 
    resizeObserver.observe(containerDivRef.current);
    //init
    setSizesAndGrid();
  }, [data])

  //data change/load
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    //reset perfectSquare component if required
    const cleanupNeeded = !d3.select(visContentsGRef.current).selectAll(".chart").empty() && !cleanupInProgressRef.current;
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
      setSizesAndTriggerDataRendering(data);
    }
  },[key])

  //container or chart size change
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    sizesRef.current = calcChartSizesAndGridLayout(contentsWidth, contentsHeight, nrCols, nrRows, nrDatapoints, arrangeBy, CALC_CHART_MARGIN);
  },[contentsWidth, contentsHeight, nrCols, nrRows, arrangeBy])

  //layout applied to data
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    const { chartWidth, chartHeight } = sizesRef.current;
    processedDataRef.current = perfectSquareLayout(data, 
      { nrCols, chartWidth, chartHeight }
    );

  }, [contentsWidth, nrCols, visKey, nrDatapoints])

  //simulation
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    const { chartWidth, chartHeight } = sizesRef.current;
    if(!dataIsArranged){ return; }

    const processedData = processedDataRef.current;
    const processedDatapoints = processedData.datapoints;
  
    //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
    const dataWasAlreadyArranged = isArranged(prevArrangeByRef.current);
    if(!dataWasAlreadyArranged){
      processedDatapoints.forEach(d => {
        d.x = d.gridX;
        d.y = d.gridY;
      })
    }

    simRef.current = d3.forceSimulation(processedDatapoints);
    setupSimulation(simRef.current, contentsWidth, contentsHeight, chartWidth, chartHeight, arrangeBy, nrDatapoints, processedData.info);

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

  //render/update entire visual
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    const arrangementHasChanged = prevArrangeByRef.current !== arrangeBy;
    //data
    const { datapoints, info } = processedDataRef.current;

    //settings
    perfectSquare
        .width(sizesRef.current.chartWidth)
        .height(sizesRef.current.chartHeight)
        .margin(sizesRef.current.chartMargin)
        .metaData({ data: { info } })
        .selectedChartKey(selectedChartKey)
        .selectedQuadrantIndex(selectedQuadrantIndex)
        .selectedMeasureKey(selectedMeasureKey)
        .setSelectedChartKey(chartKey => {
          zoomTo(chartKey, 
            () => setSelectedChartKey(chartKey));
        })
        .setSelectedMeasureKey(setSelectedMeasureKey)
        .zoomK(d3.zoomTransform(containerDivRef.current).k)
        .arrangeBy(arrangeBy)

    //position and call charts
    d3.select(visContentsGRef.current).attr("transform", `translate(${margin.left}, ${margin.top})`)
    renderCharts.call(visContentsGRef.current, datapoints, perfectSquare, dataIsArranged, {
      updateTransformTransition: arrangementHasChanged ? { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION } : null
    });

    //update flag that determines type of transition
    prevArrangeByRef.current = arrangeBy;
  }, [visKey, contentsWidth, contentsHeight, nrDatapoints, arrangeBy])


  //render/update tooltips
  useEffect(() => {
    const tooltipsData = [
      ...headerTooltipsData, 
      ...chartsViewboxTooltipsData,
      ...loadingData
    ];
    renderTooltips.call(containerDivRef.current, tooltipsData, tooltip, width, height);
  }, [width, headerTooltipsData, chartsViewboxTooltipsData, loadingData])

  //Selected chart change
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    d3.select(visContentsGRef.current).selectAll(".chart").call(perfectSquare
      .selectedChartKey(selectedChartKey))
  }, [selectedChartKey])

  //Selected quadrant change
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    d3.select(visContentsGRef.current).selectAll(".chart").call(perfectSquare
      .selectedQuadrantIndex(selectedQuadrantIndex))
  }, [selectedQuadrantIndex])

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

  //ZOOM
  const isChartOnScreenChecker = useCallback((d, zoomTransform) => {
    const { chartWidth, chartHeight } = sizesRef.current;
    const checker = isChartOnScreenCheckerFunc(contentsWidth, contentsHeight, chartWidth, chartHeight, dataIsArranged);
    return checker(d, zoomTransform);
  },[contentsWidth, contentsHeight, sizesRef, dataIsArranged])

  const resetZoom = (withTransition=true) => { 
    const zoom = zoomRef.current;
    if(withTransition){
      //tell d3comp we are zooming to a level 1, so it can ignore level 2 (if we are at level 3)
      perfectSquare.zoomingInProgress({ targK: d3.zoomIdentity.k, sourceEvent:null })
      d3.select(containerDivRef.current)
        .transition()
        .duration(ZOOM_AND_ARRANGE_TRANSITION_DURATION)
          .call(zoom.transform, d3.zoomIdentity);
    }else{
      d3.select(containerDivRef.current).call(zoom.transform, d3.zoomIdentity);
    }
  }

  const handleClickResetZoom = () => { resetZoom(); }

  const zoomTo = useCallback((chartKey, cb=() => {}) => {
    //when sim on, it still zooms in based on colnr
    const { chartWidth, chartHeight } = sizesRef.current;
    const zoom = zoomRef.current;
    const chartD = processedDataRef.current.datapoints.find(d => d.key === chartKey);
    const calcZoomTransform = calcZoomTransformFunc(contentsWidth, contentsHeight, margin, chartWidth, chartHeight, dataIsArranged);
    const transform = calcZoomTransform(chartD);
    
    //tell d3comp we are zooming to a level 3, so it can ignore level 2 (if we are at level 1)
    perfectSquare.zoomingInProgress({ targK:transform.k, sourceEvent:null })
    
    d3.select(containerDivRef.current)
      .transition()
      .duration(ZOOM_AND_ARRANGE_TRANSITION_DURATION)
        .call(zoom.transform, transform)
        .on("end", function(){ cb(); })
  },[contentsWidth, contentsHeight, nrDatapoints, arrangeBy])

  //zoom
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    if(!zoomRef.current){ zoomRef.current = d3.zoom(); }
    const zoom = zoomRef.current;
    const { chartWidth, chartHeight } = sizesRef.current;

    setupZoom(zoom, width, height, chartWidth, chartHeight, {
      onStart:() => { 
        setSelectedChartKey(""); 
      },
      onZoom:zoomed
    });

    //call zoom
    d3.select(containerDivRef.current).call(zoom);

    function zoomed(e){
      d3.select(viewGRef.current).attr("transform", e.transform);

      //update semantic zoom and virtualisation in the dom
      d3.select(containerDivRef.current).selectAll("g.chart")
        .each(function(d){ 
          d.isOnScreen = isChartOnScreenChecker(d, e.transform); 
        })
        .attr("display", d => d.isOnScreen ? null : "none")
        .filter(d => d.isOnScreen)
        .call(perfectSquare
          .zoomK(e.transform.k, true));

      //update react state
      setZoomTransformState(e.transform);
    }
    
  },[width, height, contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])

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
        resetZoom={handleClickResetZoom}
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


