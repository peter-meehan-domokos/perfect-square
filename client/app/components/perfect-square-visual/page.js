'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3';
import VisualHeader from './visual-header/page';
import perfectSquareLayout from './perfectSquareLayout';
import perfectSquareComponent from "./perfectSquareComponent";
import { remove, fadeIn } from '../../helpers/domHelpers';
import { renderCharts, renderTooltips } from './d3RenderFunctions';
import { DEFAULT_SETTINGS, SELECT_MEASURE_TOOLTIP } from "./constants.js";
import { CHART_IN_DURATION, CHART_OUT_DURATION } from '@/app/constants';

const CONTAINER_MARGIN = { left:10, right:10, top:10, bottom:10 };
const DEFAULT_CHART_MARGIN = { left:0, right:0, top:0, bottom:0 };
const ZOOM_TRANSITION_DURATION = 750;

const CHART_SIZE_REDUCTION_FACTOR_FOR_SIM = 0.6;
const COLLISION_FORCE_RADIUS_FACTOR = 1.15;//0.65
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_VERT_MARGIN_FACTOR_FOR_FORCE = 0.25// 0.15;
//const CENTRE_FORCE_STRENGTH = 1.3; //good for just nmena arranged
const CENTRE_FORCE_STRENGTH = 1.8;

const calcNrColsAndRows = (containerWidth, containerHeight, n) => {
  //aspect ratio, a
  const a = containerWidth / containerHeight;
  const proportionOfNForWidth = Math.sqrt(n * a);
  const nrCols = Math.round(proportionOfNForWidth);
  //always round up the rows so there is enough cells
  const nrRows = Math.ceil(n/nrCols);
  //@todo - consider adjusting cols if ther is an orphan on last row ie 
  //const nrOnLastRow = n - (nrRows-1) * nrCols;
  return { nrCols, nrRows }
}

const calculateChartSizesAndGridLayout = (contentsWidth, contentsHeight, nrCols, nrRows, arrangeBy, _chartMargin={}) => {
  //nrRows and cols
  //dimns for single chart
  //flag
  const reductionFactor = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? CHART_SIZE_REDUCTION_FACTOR_FOR_SIM : 1;
  const chartWidth = reductionFactor * contentsWidth / nrCols;
  const chartHeight = reductionFactor * contentsHeight / nrRows;
  const chartMarginValues = typeof _chartMargin === "function" ? _chartMargin(chartWidth, chartHeight) : _chartMargin;
  const chartMargin = { ...DEFAULT_CHART_MARGIN, ...chartMarginValues }

  return { 
    chartWidth, chartHeight, chartMargin, 
    nrRows, nrCols
  }
}

const perfectSquare = perfectSquareComponent();

const PerfectSquareVisual = ({ data={ datapoints:[], info:{ } }, initSelectedChartKey="", initSelectedMeasureKey="", initSettings }) => {

  //state
  //this triggers the container to be sized, which triggers everything else
  const [dataKey, setDataKey] = useState(data.key);
  const [cleanUpInProgress, setCleanupInProgress] = useState(false);
  const [headerExtended, setHeaderExtended] = useState(false);
  const [containerSizesAndGrid, setContainerSizesAndGrid] = useState({});
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState(initSelectedMeasureKey);
  const [settings, setSettings] = useState(initSettings || DEFAULT_SETTINGS)
  const [headerTooltipsData, setHeaderTooltipsData] = useState([]);
  const [chartsViewboxTooltipsData, setChartsViewboxTooltipsData] = useState([]);
  //only used for React components
  const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity)

  const { width, height, margin, contentsWidth, contentsHeight, nrDatapoints, nrCols, nrRows, visKey } = containerSizesAndGrid;
  const { arrangeBy } = settings;
  const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
  //refs
  const isFirstRender = useRef(true);
  const containerRef = useRef(null);
  const visContentsGRef = useRef(null);
  const viewRef = useRef(null);
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
      if(!containerRef.current){ return; }
      const width = containerRef.current.getBoundingClientRect().width;
      const height = containerRef.current.getBoundingClientRect().height;
      const margin = CONTAINER_MARGIN;
      const contentsWidth = width - margin.left - margin.right;
      const contentsHeight = height - margin.top - margin.bottom;
      const nrDatapoints = data.datapoints.length;
      const { nrCols, nrRows } = !nrDatapoints ? { nrCols:1, nrRows:1 } : calcNrColsAndRows(contentsWidth, contentsHeight, nrDatapoints);
      //visKey helps control the triggering of dom updates in useEffects
      setContainerSizesAndGrid({ width, height, contentsWidth, contentsHeight, margin, nrCols, nrRows, nrDatapoints, visKey:data.key })
    }

    let resizeObserver = new ResizeObserver(() => { setSizesAndGrid(); }); 
    resizeObserver.observe(containerRef.current);
    //init
    setSizesAndGrid();
  }, [data])

  //Entire data change/load (eg example changed)
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("dataKeyChangeUE......1", datapoints.length)
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
        setDataKey(key);
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
    if (isFirstRender.current || !contentsWidth) { return; }
    //console.log("chartSizesUE...3", containerSizesAndGrid)
    sizesRef.current = calculateChartSizesAndGridLayout(contentsWidth, contentsHeight, nrCols, nrRows, arrangeBy, chartMargin);
  },[contentsWidth, contentsHeight, nrCols, nrRows, arrangeBy])

  //layout applied to data
  useEffect(() => {
    if (isFirstRender.current || !contentsWidth) { return; }
    //console.log("layoutUE...4", data.datapoints.length)
    const { chartWidth, chartHeight } = sizesRef.current;
    processedDataRef.current = perfectSquareLayout(data, 
      { nrCols, chartWidth, chartHeight }
    );

  }, [contentsWidth, nrCols, visKey, nrDatapoints])

  //simulation
  useEffect(() => {
    if (isFirstRender.current || !contentsWidth) { return; }
    const { chartWidth, chartHeight } = sizesRef.current;
    const { arrangeBy } = settings;
    const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
    if(!dataIsArranged){ return; }
    //console.log("simUE...6..setting up sim!!!!!")

    const processedData = processedDataRef.current;
    const processedDatapoints = processedData.datapoints;
    const { mean, deviation } = processedData.info;
  
    //force
    //set the starting position for a smooth transition from the grid
    //@todo - recalc isOnScreen too
    processedDatapoints.forEach(d => {
      d.x = d.gridX;
      d.y = d.gridY;
    })
    
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
        d3.select(containerRef.current).select("g.viz-contents").selectAll("g.chart")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
      })
      .on("end", () => { simTicksInProcessRef.current = false; })

  }, [contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])


  //render/update entire visual
  useEffect(() => {
    if (isFirstRender.current || !contentsWidth) { return; }
    const { arrangeBy } = settings;
    const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
    //console.log("renderChartUE...contw chartw",Math.round(contentsWidth), Math.round(sizesRef.current.chartWidth))
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
        //.setSelectedMeasureKey((measureKey) => { console.log("meas", measureKey)})
        .setSelectedMeasureKey(setSelectedMeasureKey)
        .zoomK(d3.zoomTransform(containerRef.current).k)
        .arrangeBy(arrangeBy)

    //call chart
    d3.select(visContentsGRef.current)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)

    /*const bgRect = d3.select(visContentsGRef.current).selectAll("rect.vis-bg").data([1])
    bgRect.enter()
        .append("rect")
        .attr("class", "vis-bg")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .merge(bgRect)
        .attr("width", contentsWidth)
        .attr("height", contentsHeight)*/

    renderCharts.call(visContentsGRef.current, datapoints, perfectSquare, dataIsArranged, simTicksInProcessRef.current);
  }, [contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])

  

  //render/update tooltips
  useEffect(() => {
    renderTooltips.call(containerRef.current, [...headerTooltipsData, ...chartsViewboxTooltipsData], width);
  }, [width, headerTooltipsData, chartsViewboxTooltipsData])

  //Selected chart change
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("selectedChartKeyUE...8", data.datapoints.length)
    d3.select(visContentsGRef.current)
      .selectAll(".chart")
      .call(perfectSquare
        .selectedChartKey(selectedChartKey))
  }, [selectedChartKey])

  //Selected quadrant change
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("selectedQuadrantIndexUE...9", data.datapoints.length)
    d3.select(visContentsGRef.current)
      .selectAll(".chart")
      .call(perfectSquare
        .selectedQuadrantIndex(selectedQuadrantIndex))
  }, [selectedQuadrantIndex])

  //Selected measure change
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //for now, just show a tooltip
    if(selectedMeasureKey){
      setChartsViewboxTooltipsData([SELECT_MEASURE_TOOLTIP])
      setTimeout(() => { 
        setChartsViewboxTooltipsData([]); 
        setSelectedMeasureKey("");
      }, 3000)
    }
  }, [selectedMeasureKey])

    //arrangement change
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("arrangeByUE...9", data.datapoints.length)
    //setSelectedChartKey("");
    //resetZoom();
  },[arrangeBy])

  //ZOOM
  //zoom-related helpers
  const isChartOnScreenChecker = (d, zoomTransform) => {
    const { contentsWidth, contentsHeight } = containerSizesAndGrid;
    const { x, y, k } = zoomTransform;

    const chartX1 = dataIsArranged ? d.x : d.gridX;
    const chartY1 = dataIsArranged ? d.y : d.gridY;
    const chartX2 = chartX1 + sizesRef.current.chartWidth;
    const chartY2 = chartY1 + sizesRef.current.chartHeight;

    const bufferSize = 0;// contentsWidth * 0.2;
    const isOnScreenHorizontally = chartX2 * k + x >= -bufferSize && chartX1 * k + x <= contentsWidth + bufferSize;
    const isOnScreenVertically = chartY2 * k + y >= -bufferSize && chartY1 * k + y <= contentsHeight + bufferSize; 
    return isOnScreenHorizontally && isOnScreenVertically ? true : false;
  }

  const resetZoom = (withTransition=true) => { 
    const zoom = zoomRef.current;
    if(withTransition){
      //tell d3comp we are zooming to a level 1, so it can ignore level 2 (if we are at level 3)
      perfectSquare.zoomingInProgress({ targK: d3.zoomIdentity.k, sourceEvent:null })
      d3.select(containerRef.current)
        .transition()
        .duration(ZOOM_TRANSITION_DURATION)
          .call(zoom.transform, d3.zoomIdentity);
    }else{
      d3.select(containerRef.current).call(zoom.transform, d3.zoomIdentity);
    }
  }

  const handleClickResetZoom = () => { resetZoom(); }

  const zoomTo = useCallback((chartKey, cb=() => {}) => {
    //when sim on, it still zooms in based on colnr
    const { chartWidth, chartHeight } = sizesRef.current;
    const zoom = zoomRef.current;
    const chartD = processedDataRef.current.datapoints.find(d => d.key === chartKey);
    const k = d3.min([contentsWidth/chartWidth, contentsHeight/chartHeight]);
    //we remove teh impact of zoom on margin. This is needed because we want teh chart to have a margin, 
    //but when user zooms manually, we want it to disappear, which is more immersive (ie no artificial border)
    //therefore zoom is on the margin aswell, so we must discount it so it isnt enlarged
    const marginLeftAdjustment = CONTAINER_MARGIN.left - k * CONTAINER_MARGIN.left;
    const marginTopAdjustment = CONTAINER_MARGIN.top - k * CONTAINER_MARGIN.top

    //zoom into selected chart
    const xPos = dataIsArranged ? chartD.x : chartD.gridX;
    const yPos = dataIsArranged ? chartD.y : chartD.gridY;
    const x = -(xPos * k) + (contentsWidth - (k * chartWidth))/2 + marginLeftAdjustment;
    const y = -(yPos * k) + (contentsHeight - (k * chartHeight))/2 + marginTopAdjustment;
    //const x = -chartWidth * chartD.colNr * k + marginLeftAdjustment + (extraHorizSpace/2);
    //const y = -chartHeight * chartD.rowNr * k + marginTopAdjustment + (extraVertSpace/2);
    const transform = d3.zoomIdentity.translate(x, y).scale(k);

    //tell d3comp we are zooming to a level 3, so it can ignore level 2 (if we are at level 1)
    perfectSquare.zoomingInProgress({ targK:transform.k, sourceEvent:null })
    
    d3.select(containerRef.current)
      .transition()
      .duration(ZOOM_TRANSITION_DURATION)
        .call(zoom.transform, transform)
        .on("end", function(){ cb(); })
  },[contentsWidth, contentsHeight, nrDatapoints, arrangeBy])

  //zoom
  useEffect(() => {
    if (isFirstRender.current || !contentsWidth) { return; }
    //console.log("zoomSetupUE...10", data.datapoints.length)
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
    d3.select(containerRef.current).call(zoom);

    function zoomed(e){
      //update geometric zoom
      d3.select(viewRef.current).attr("transform", e.transform);

      //update semantic zoom and virtualisation in the dom
      d3.select(containerRef.current).selectAll("g.chart")
        .each(function(d){ d.isOnScreen = isChartOnScreenChecker(d, e.transform); })
        .attr("display", d => d.isOnScreen ? null : "none")
        .filter(d => d.isOnScreen).call(perfectSquare
          .zoomK(e.transform.k, true));

      //update react state
      setZoomTransformState(e.transform);
    }
  },[width, height, contentsWidth, contentsHeight, visKey, nrDatapoints, arrangeBy])

  useEffect(() => { isFirstRender.current = false; })

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
        <div className="viz-inner-container" ref={containerRef}>
          <svg className="viz" width="100%" height="100%" >
            <g ref={viewRef}>
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


