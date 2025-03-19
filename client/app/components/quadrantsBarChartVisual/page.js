'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3';
import VisualHeader from './visual-header/page';
import { quadrantsBarChartLayout } from './quadrantsBarChartLayout';
import quadrantsBarChart from "./quadrantsBarChartComponent";
import tooltipComponent from "../d3HelperComponents/tooltipComponent";
import { remove, fadeIn } from '../../helpers/domHelpers';
import { DEFAULT_SETTINGS, SETTINGS_OPTIONS } from "./constants.js";

const CONTAINER_MARGIN = { left:0, right:0, top:0, bottom:0 };
const DEFAULT_CHART_MARGIN = { left:0, right:0, top:0, bottom:0 };
const TRANSITION_OUT = { 
  duration:800,
  delay: 50
}

const TRANSITION_IN = { 
  duration: 500, 
  delay:TRANSITION_OUT.delay + TRANSITION_OUT.duration + 200 
}

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
  const reductionForArrangement = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? 0.35 : 1;
  const chartWidth = reductionForArrangement * contentsWidth / nrCols;
  const chartHeight = reductionForArrangement * contentsHeight / nrRows;
  const chartMarginValues = typeof _chartMargin === "function" ? _chartMargin(chartWidth, chartHeight) : _chartMargin;
  const chartMargin = { ...DEFAULT_CHART_MARGIN, ...chartMarginValues }

  return { 
    chartWidth, chartHeight, chartMargin, 
    nrRows, nrCols
  }
}

const chart = quadrantsBarChart();
const tooltip = tooltipComponent();

const QuadrantsBarChartVisual = ({ data={ datapoints:[], info:{ } }, initSelectedChartKey="", initSettings }) => {
  //console.log("QuadsBarChart", data)
  //state
  const [headerExtended, setHeaderExtended] = useState(false);
  const [containerSizesAndGrid, setContainerSizesAndGrid] = useState({});
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [zoomState, setZoomState] = useState({ transform:d3.zoomIdentity, manual:false });
  const [settings, setSettings] = useState(initSettings || DEFAULT_SETTINGS)
  const [tooltipsData, setTooltipsData] = useState([]);
  //refs
  const isFirstRender = useRef(true);
  const containerRef = useRef(null);
  const zoomGRef = useRef(null);
  
  //store the actual zoom function so we can access its methods to get/set the transform
  const zoomRef = useRef(null);
  const simRef = useRef(null);
  const simIsStartedRef = useRef(false);
  //other data that doesnt trigger re-renders
  const sizesRef = useRef(null);
  const processedDataRef = useRef(null);

  const { key, title, desc, info, categories, datapoints } = data

  const headerData = {
    key,
    title,
    categories,
    desc,
    info
  }

  //helpers
  const chartMargin = (width, height) => ({ left:width * 0.1, right:width * 0.1, top:height * 0.1, bottom:height * 0.1 });
  const toggleHeaderExtended = e => {
    setHeaderExtended(prevState => !prevState);
  }

  //container size and grid
  useEffect(() => {
    //console.log("resizeUE...1")
    const setSizesAndGrid = () => {
      const width = containerRef.current.getBoundingClientRect().width;
      const height = containerRef.current.getBoundingClientRect().height;
      const margin = CONTAINER_MARGIN;
      const contentsWidth = width - margin.left - margin.right;
      const contentsHeight = height - margin.top - margin.bottom;
      const nrDatapoints = data.datapoints.length;
      const { nrCols, nrRows } = !nrDatapoints ? { nrCols:1, nrRows:1 } : calcNrColsAndRows(contentsWidth, contentsHeight, nrDatapoints);
      setContainerSizesAndGrid({ width, height, contentsWidth, contentsHeight, margin, nrCols, nrRows, nrDatapoints })
    }
    let resizeObserver = new ResizeObserver(() => { setSizesAndGrid(); }); 
    resizeObserver.observe(containerRef.current);
    //init
    setSizesAndGrid();
  }, [data.datapoints.length]);

  //chart sizes
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("chartSizesUE...2")
    const { contentsWidth, contentsHeight, nrCols, nrRows } = containerSizesAndGrid;
    sizesRef.current = calculateChartSizesAndGridLayout(contentsWidth, contentsHeight, nrCols, nrRows, settings.arrangeBy, chartMargin);
  },[containerSizesAndGrid, settings.arrangeBy])

  //change the overall viz dataset (not just the datapoints)
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("dataKeyChangeUE...3")
    setTimeout(() => {
      setSelectedQuadrantIndex(null);
      setSelectedChartKey("");
      if(zoomRef.current){ d3.select(containerRef.current).call(zoomRef.current.transform, d3.zoomIdentity); }
      setZoomState({ transform:d3.zoomIdentity, manual:true });
    }, TRANSITION_OUT.delay + TRANSITION_OUT.duration)
  },[key])

  //reset zoom if user changes arrangement
  useEffect(() => {
    if (isFirstRender.current) { return; }
    setZoomState({ transform:d3.zoomIdentity, manual:false });
  },[settings.arrangeBy])

  //note- this useEffect may be neede don first render, if a selectedChartKey is passed in
  useEffect(() => {
    //console.log("selectedChartKeyUE...4")
    chart.selectedChartKey(selectedChartKey)
    //user deselects by zooming or panning manually, so no need to do anything here in that case
    if(!selectedChartKey){ return; }
    const { contentsWidth, contentsHeight } = containerSizesAndGrid;
    const chartD = d3.select(`#chart-${selectedChartKey}`).datum();
    //zoom into selected chart
    const k = d3.min([contentsWidth/sizesRef.current.chartWidth, contentsHeight/sizesRef.current.chartHeight]);
    const extraHorizSpace = contentsWidth - sizesRef.current.chartWidth * k;
    const extraVertSpace = contentsHeight - sizesRef.current.chartHeight * k;
    const x = -sizesRef.current.chartWidth * chartD.colNr * k + extraHorizSpace/2;
    const y = -sizesRef.current.chartHeight * chartD.rowNr * k + extraVertSpace/2;
    const transform = d3.zoomIdentity.translate(x, y).scale(k);
    setZoomState({ transform, manual:false });
    //note - if user pans or zooms away from it manually, then we immediately deselect chart,
    //as there are no other things that change when a chart is selected at present
  }, [containerSizesAndGrid, selectedChartKey])

  //layout applied to data
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("layoutUE...5")
    processedDataRef.current = quadrantsBarChartLayout(data, { nrCols: containerSizesAndGrid.nrCols });

    //issue - we need new layout when containersize changes as nr cols might change
    //options -> put nrcols and rows into containerSizesAndGrid instead of sizesRef
    //trigger this uE another way (not good practice)
  }, [containerSizesAndGrid.nrCols, data.key, data.datapoints])

  //simulation
  useEffect(() => {
    if (isFirstRender.current) { return; }
    const { contentsWidth, contentsHeight, nrDatapoints } = containerSizesAndGrid;
    const { arrangeBy } = settings;
    const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
    if(!dataIsArranged){ return; }
    //console.log("simUE...6")

    const processedData = processedDataRef.current;
    const processedDatapoints = processedData.datapoints;
    const { value, deviation } = processedData.info;
  
    //force
    simRef.current = d3.forceSimulation(processedDatapoints);
    const sim = simRef.current;
    const extraMarginForForce = contentsWidth * 0.05;
    const horizSpace = contentsWidth - 2 * extraMarginForForce
    const vertSpace = contentsHeight - 2 * extraMarginForForce;
    const horizSpacePerChart = horizSpace/nrDatapoints;
    const vertSpacePerChart = vertSpace/nrDatapoints;
    sim
    //add option to group by std dev on x axis instead of by datatset order eg date
    //@todo -sort out when we need to subtract or add teh extra margins below, as may be wrong
      .force("x", d3.forceX(d => {
        if(arrangeBy.x === "position" && d.date){
          //@todo - implement this similar to value and deviation (and can just replace all 3 with d3 scales)
        }
        if(arrangeBy.x === "position"){
          return (horizSpacePerChart) * d.i + extraMarginForForce;
        }
        if(arrangeBy.x === "value"){
          return horizSpace * (d.info.value - value.min)/value.range + extraMarginForForce - horizSpacePerChart;
        }
        if(arrangeBy.x === "deviation"){
          return horizSpace - (horizSpace * (d.info.deviation - deviation.min)/deviation.range) + extraMarginForForce - horizSpacePerChart;
        }
        //default to centre of screen
        return (contentsWidth - horizSpacePerChart)/2;
      })) 
      .force("y", d3.forceY(d => {
        if(arrangeBy.y === "position" && d.date){
          //@todo - implement this similar to value and deviation (and can just replace all 3 with d3 scales)
        }
        if(arrangeBy.y === "position"){
          return contentsHeight - (vertSpacePerChart) * d.i + extraMarginForForce;
        }
        if(arrangeBy.y === "value"){
          return contentsHeight - (vertSpace * (d.info.value - value.min)/value.range) - extraMarginForForce - vertSpacePerChart;
        }
        if(arrangeBy.y === "deviation"){
          return vertSpace * (d.info.deviation - deviation.min)/deviation.range + extraMarginForForce - vertSpacePerChart;
        }
        //default to centre of screen
        return (contentsHeight - vertSpacePerChart)/2;
      })) 
      .force("collide", d3.forceCollide().radius(sizesRef.current.chartWidth * 0.5))
      //@todo - base the strenght of the manybody force on a similarity matrix (ie a score per pair)
      //greater attraction force when more similar from neg (if similarity low) to positive
      //oiny apli when no x and y arrangements
      //.force("charge", d3.forceManyBody().strength(d => ))

    sim.on("tick", () => {
      if(!simIsStartedRef.current){ return; }
      d3.select(containerRef.current).select("g.vis-contents").selectAll("g.chart")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
    })

  }, [containerSizesAndGrid, settings.arrangeBy])
  //render/update chart
  useEffect(() => {
    if (isFirstRender.current) { return; }
    const { arrangeBy } = settings;
    const dataIsArranged = arrangeBy.x || arrangeBy.y || arrangeBy.colour ? true : false;
    //console.log("renderChartUE...7", dataIsArranged)
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
    chart
        .width(sizesRef.current.chartWidth)
        .height(sizesRef.current.chartHeight)
        .margin(sizesRef.current.chartMargin)
        .metaData({ data: { info } })
        .selectedQuadrantIndex(selectedQuadrantIndex)
        .setSelectedChartKey(setSelectedChartKey)
        .zoomState(zoomState)
        .arrangeBy(settings.arrangeBy)

    //call chart
    const visContentsG = d3.select(containerRef.current).select("g.vis-contents")
      .attr("transform", `translate(${containerSizesAndGrid.margin.left}, ${containerSizesAndGrid.margin.top})`)

    const chartG = visContentsG.selectAll("g.chart").data(datapoints, d => d.key);
    chartG.enter()
      .append("g")
        .attr("class", "chart")
        .attr("id", d => `chart-${d.key}`)
        .call(fadeIn, { transition:TRANSITION_IN})
        .merge(chartG)
        .attr("transform", (d,i) => dataIsArranged ? null : `translate(${d.colNr * sizesRef.current.chartWidth},${d.rowNr * sizesRef.current.chartHeight})`)
        .call(chart);

    chartG.exit().call(remove, { transition:TRANSITION_OUT});

  }, [containerSizesAndGrid, selectedQuadrantIndex, settings.arrangeBy])

  useEffect(() => {
    console.log("tooltipsUE...", tooltipsData)
    const tooltipWidth = 150;
    const tooltipHeight = 150;

    const tooltipG = d3.select(containerRef.current).select("svg.viz").selectAll("g.tooltip").data(tooltipsData, t => t.key);
    tooltipG.enter()
      .append("g")
        .attr("class", "tooltip")
        .merge(tooltipG)
        .attr("transform", `translate(${containerSizesAndGrid.width - tooltipWidth}, 0)`)
        .call(tooltip
          .width(tooltipWidth)
          .height(tooltipHeight))

    tooltipG.exit().each(function(d){
      const tooltipG = d3.select(this);
      d3.select('clipPath#tooltip-clip').select('rect')
        .transition()
        .duration(500)
            .attr('height', 0)
            .on("end", () => { tooltipG.remove(); })
    });

  }, [tooltipsData])

  //zoom set-up
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("zoomSetupUE...8")
    if(!zoomRef.current){ zoomRef.current = d3.zoom(); }
    zoomRef.current
      .scaleExtent([1, 100])
      //@todo - make this contentsWidth and height, and shoft zoomG too by the margin
      .translateExtent([[0, 0], [containerSizesAndGrid.width, containerSizesAndGrid.height]])
      .on("zoom", e => { 
        //when user manually zooms, the selected chart is no longer selected
        if(e.sourceEvent){ setSelectedChartKey("")};
        setZoomState({ transform:e.transform, manual:true }); 
      })

    //call zoom
    d3.select(containerRef.current).call(zoomRef.current);
  },[containerSizesAndGrid])

  //zoom change
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("zoomChangeUE...9")
    //update zoomstate in the dom
    if(zoomState.manual){
      d3.select(zoomGRef.current).attr("transform", zoomState.transform);
    }else{
      d3.select(zoomGRef.current)
        .transition()
        .duration(500)
          .attr("transform", zoomState.transform)
          .on("end", () => {
            d3.select(containerRef.current).call(zoomRef.current.transform, zoomState.transform)
          });
    }
    //pass zoomstate change onto component for other adjustments
    chart.zoomState(zoomState, true)
  },[zoomState])

  useEffect(() => { isFirstRender.current = false; })

  const onClickZoom = useCallback((zoomDirection) => {
    const { transform } = zoomState;
    const zoomFactor = 0.3;
    const potentialNewK = zoomDirection === "in" ? transform.k + zoomFactor : transform.k - zoomFactor;
    const newK = d3.max([1, potentialNewK]);
    const deltaK = newK/transform.k;
    const newTransform = transform.scale(deltaK);
    setZoomState({ transform:newTransform, manual:false });
  }, [zoomState.transform])

  const resetZoom = () => { 
    setSelectedChartKey("")
    setZoomState({ transform:d3.zoomIdentity, manual:false }); 
  }

  return (
    <div className="viz-root">
      <VisualHeader 
        data={headerData} 
        settings={settings}
        zoomTransform={zoomState.transform}
        headerExtended={headerExtended} 
        onClickZoom={onClickZoom}
        setHeaderExtended={setHeaderExtended} 
        selectedQuadrantIndex={selectedQuadrantIndex}
        setSelectedQuadrantIndex={setSelectedQuadrantIndex}
        setSettings={setSettings}
        resetZoom={resetZoom}
        setTooltipsData={setTooltipsData}
      />
      <div className={`viz-container ${headerExtended ? "with-extended-header" : ""}`} >
        <div className="viz-inner-container" ref={containerRef}>
          <svg className="viz" width="100%" height="100%">
            <g ref={zoomGRef}>
              <g className="vis-contents"></g>
            </g>
            <defs>
              <clipPath id="tooltip-clip">
                <rect></rect>
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default QuadrantsBarChartVisual;


