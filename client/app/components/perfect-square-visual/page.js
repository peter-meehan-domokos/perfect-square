'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3';
import VisualHeader from './visual-header/page';
import perfectSquareLayout from './perfectSquareLayout';
import perfectSquareComponent from "./perfectSquareComponent";
import { renderCharts, renderTooltips } from './d3RenderFunctions';
import { DEFAULT_SETTINGS, SELECT_MEASURE_TOOLTIP, CONTAINER_MARGIN } from "./constants.js";
import { CHART_OUT_DURATION } from '@/app/constants';
import { isArranged, calcNrColsAndRows, calcChartSizesAndGridLayout, applyMargin, isChartOnScreenCheckerFunc, calcZoomTransformFunc } from './helpers';
import { getElementDimns } from '@/app/helpers/domHelpers';

const ZOOM_AND_ARRANGE_TRANSITION_DURATION = 750;
const COLLISION_FORCE_RADIUS_FACTOR = 1.15;//0.65
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_VERT_MARGIN_FACTOR_FOR_FORCE = 0.25// 0.15;
//const CENTRE_FORCE_STRENGTH = 1.3; //good for just nmena arranged
const CENTRE_FORCE_STRENGTH = 1.8;

const perfectSquare = perfectSquareComponent();

const defaultSettings = { arrangeBy:{ x:"", y:"", colour:""} }

const PerfectSquareVisual = ({ data={ datapoints:[], info:{ } }, initSelections={}, initSettings=defaultSettings }) => {
  const { initSelectedChartKey="", initSelectedMeasureKey="", initSelectedQuadrantIndex=null } = initSelections;
  //state
  //this triggers the container to be sized, which triggers everything else
  const [headerExtended, setHeaderExtended] = useState(false);
  const [containerSizesAndGrid, setContainerSizesAndGrid] = useState({});
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(initSelectedQuadrantIndex);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);
  const [settings, setSettings] = useState(initSettings || DEFAULT_SETTINGS)
  const [headerTooltipsData, setHeaderTooltipsData] = useState([]);
  const [chartsViewboxTooltipsData, setChartsViewboxTooltipsData] = useState([]);
  //only used for React components
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

  //helpers
  const chartMargin = (width, height) => ({ left:width * 0.1, right:width * 0.1, top:height * 0.1, bottom:height * 0.1 });
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

  //Entire data change/load (eg example changed)
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
    sizesRef.current = calcChartSizesAndGridLayout(contentsWidth, contentsHeight, nrCols, nrRows, arrangeBy, chartMargin);
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
    const { arrangeBy } = settings;
    const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
    if(!dataIsArranged){ return; }

    const processedData = processedDataRef.current;
    const processedDatapoints = processedData.datapoints;
    const { mean, deviation } = processedData.info;
  
    //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
    const dataWasAlreadyArranged = isArranged(prevArrangeByRef.current);
    if(!dataWasAlreadyArranged){
      processedDatapoints.forEach(d => {
        d.x = d.gridX;
        d.y = d.gridY;
      })
    }

    simRef.current = d3.forceSimulation(processedDatapoints);
    const sim = simRef.current;
    const extraHorizMarginForForce = contentsWidth * EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE;
    const extraVertMarginForForce = contentsHeight * EXTRA_VERT_MARGIN_FACTOR_FOR_FORCE;
    const horizSpace = contentsWidth - 2 * extraHorizMarginForForce
    const vertSpace = contentsHeight - 2 * extraVertMarginForForce;
    const horizSpacePerChart = horizSpace/nrDatapoints;
    const vertSpacePerChart = vertSpace/nrDatapoints;

    sim
      .force("center", d3.forceCenter(contentsWidth / 2, contentsHeight / 2).strength(CENTRE_FORCE_STRENGTH))
      .force("collide", d3.forceCollide().radius((sizesRef.current.chartWidth/2) * COLLISION_FORCE_RADIUS_FACTOR))
      .force("x", d3.forceX(d => {
        //need to centre each chart in its horizspaceperchart ie +(hozspacePerChart - chartWidth)/2
        const adjuster = extraHorizMarginForForce + (horizSpacePerChart - chartWidth)/2;
        if(arrangeBy.x === "position" && d.date){
          //@todo - implement this similar to mean and deviation (and can just replace all 3 with d3 scales)
          return 0;
        }
        if(arrangeBy.x === "position"){
          return horizSpacePerChart * d.i + adjuster;
        }
        if(arrangeBy.x === "mean"){
          const proportion = mean.range === 0 ? 0.5 : (d.info.mean - mean.min)/mean.range;
          //when prop = 1 ie max chart, its off the screen, so need to adjust it back. This way, if prop=0, it will still be at the start of space
          return (horizSpace - horizSpacePerChart) * proportion + adjuster;
        }
        if(arrangeBy.x === "deviation"){
          //invert it by subtracting the proportion from 1 to get prop value
          const proportion = deviation.range === 0 ? 0.5 : 1 - (d.info.deviation - deviation.min)/deviation.range
          return (horizSpace - horizSpacePerChart) * proportion + adjuster;
        }
        //default to centre of screen
        return (contentsWidth - sizesRef.current.chartWidth)/2;
      })) 
      .force("y", d3.forceY(d => {
        const adjuster = (vertSpacePerChart - chartHeight)/2 - extraVertMarginForForce;
        if(arrangeBy.y === "position" && d.date){
          //@todo - implement this similar to mean and deviation (and can just replace all 3 with d3 scales)
        }
        if(arrangeBy.y === "position"){
          return contentsHeight - (d.i + 1) * vertSpacePerChart + adjuster;
        }
        if(arrangeBy.y === "mean" && mean.range !== 0){
          const proportion = (d.info.mean - mean.min)/mean.range;
          return contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportion) + adjuster;
        }
        if(arrangeBy.y === "deviation" && deviation.range !== 0){
          const proportion = 1 - (d.info.deviation - deviation.min)/deviation.range;
          return contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportion) + adjuster;
        }

        //default to centre of screen
        return (contentsHeight - sizesRef.current.chartHeight)/2;
      }))

    sim
      .on("tick", () => {
        if(!simTicksInProcessRef.current){ simTicksInProcessRef.current = true; }
        if(!simIsStartedRef.current){ return; }
        d3.select(containerDivRef.current).select("g.viz-contents").selectAll("g.chart")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
      })
      .on("end", () => { simTicksInProcessRef.current = false; })

  }, [contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])

  //render/update entire visual
  useEffect(() => {
    if (isFirstRenderRef.current || !contentsWidth) { return; }
    const { arrangeBy } = settings;
    const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
    const arrangementHasChanged = prevArrangeByRef.current !== arrangeBy;
    //data
    const { datapoints, info } = processedDataRef.current;

    if(!dataIsArranged){
      simRef.current?.stop();
      simIsStartedRef.current = false;
    }else{
      simRef.current?.restart();
      simIsStartedRef.current = true;
    }

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

    //call chart
    d3.select(visContentsGRef.current)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)

    renderCharts.call(visContentsGRef.current, datapoints, perfectSquare, dataIsArranged, {
      updateTransformTransition: arrangementHasChanged ? { duration:ZOOM_AND_ARRANGE_TRANSITION_DURATION } : null
    });
    //update flag for transition
    prevArrangeByRef.current = arrangeBy;
  }, [visKey, contentsWidth, contentsHeight, nrDatapoints, arrangeBy])


  //render/update tooltips
  useEffect(() => {
    renderTooltips.call(containerDivRef.current, [...headerTooltipsData, ...chartsViewboxTooltipsData], width);
  }, [width, headerTooltipsData, chartsViewboxTooltipsData])

  //Selected chart change
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    d3.select(visContentsGRef.current)
      .selectAll(".chart")
      .call(perfectSquare
        .selectedChartKey(selectedChartKey))
  }, [selectedChartKey])

  //Selected quadrant change
  useEffect(() => {
    if (isFirstRenderRef.current) { return; }
    d3.select(visContentsGRef.current)
      .selectAll(".chart")
      .call(perfectSquare
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
    //can zoom in until 1 chart takes up the screen
    const kMax = d3.max([contentsWidth/sizesRef.current.chartWidth, contentsHeight/sizesRef.current.chartHeight]);
    zoom
      .scaleExtent([1, kMax])
      //@todo - make this contentsWidth and height, and shoft zoomG too by the margin
      .translateExtent([[0, 0], [width, height]])
      .on("start", () => {
        setSelectedChartKey("");
      })
      .on("zoom", zoomed)
      .on("end", (e) => {
        //update react state too
        setZoomTransformState(e.transform);
      })

    //call zoom
    d3.select(containerDivRef.current).call(zoom);

    function zoomed(e){
      //update geometric zoom
      d3.select(viewGRef.current).attr("transform", e.transform);

      //update semantic zoom and virtualisation in the dom
      d3.select(containerDivRef.current).selectAll("g.chart")
        .each(function(d){ d.isOnScreen = isChartOnScreenChecker(d, e.transform); })
        .attr("display", d => d.isOnScreen ? null : "none")
        .filter(d => d.isOnScreen).call(perfectSquare
          .zoomK(e.transform.k, true));

      //update react state
      setZoomTransformState(e.transform);
    }
  },[width, height, contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])

  useEffect(() => { isFirstRenderRef.current = false; })

  return (
    <div className="viz-root">
      <VisualHeader 
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


