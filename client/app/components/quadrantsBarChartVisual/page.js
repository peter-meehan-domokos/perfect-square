'use client'
import React, { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3';
import { quadrantsBarChartLayout } from './quadrantsBarChartLayout';
import quadrantsBarChart from "./quadrantsBarChartComponent";
import quadrantsBarChartKey from "./quadrantsBarChartKeyComponent";
import { remove, fadeIn } from '../../helpers/domHelpers';

const CONTAINER_MARGIN = { left:0, right:0, top:0, bottom:0 };// { left:10, right:10, top:10, bottom:40 };
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

const calculateChartSizesAndGridLayout = (container, nrItems, _containerMargin={}, _chartMargin={}) => {
  //dimns for overall container
  const containerWidth = container.getBoundingClientRect().width;
  const containerHeight = container.getBoundingClientRect().height;
  const defaultMargin = { left:0, right:0, top:0, bottom:0 };
  const containerMarginValues = typeof _containerMargin === "function" ? _containerMargin(containerWidth, containerHeight) : _containerMargin;
  const containerMargin = { ...defaultMargin, ...containerMarginValues };
  const contentsWidth = containerWidth - containerMargin.left - containerMargin.right;
  const contentsHeight = containerHeight - containerMargin.top - containerMargin.bottom;

  //nrRows and cols
  const { nrCols, nrRows } = !nrItems ? { nrCols:1, nrRows:1 } : calcNrColsAndRows(contentsWidth, contentsHeight, nrItems);
  //dimns for single chart
  const chartWidth = 0.35 * contentsWidth / nrCols;
  const chartHeight = 0.35 * contentsHeight / nrRows;
  const chartMarginValues = typeof _chartMargin === "function" ? _chartMargin(chartWidth, chartHeight) : _chartMargin;
  const chartMargin = { ...defaultMargin, ...chartMarginValues }

  return { 
    containerWidth, containerHeight, containerMargin, contentsWidth, contentsHeight,
    chartWidth, chartHeight, chartMargin, 
    nrRows, nrCols, nrCharts:nrItems 
  }
}

const chart = quadrantsBarChart();
const chartKey = quadrantsBarChartKey();
const chartKeySmallScreen = quadrantsBarChartKey();

const QuadrantsBarChartVisual = ({ data={ datapoints:[], info:{ } }, initSelectedChartKey="" }) => {
  //why is this not using teh default, instead it passes through teh null
  //console.log("QuadsBarChart", data)
  //state
  const [sizes, setSizes] = useState(null);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [headerExtended, setHeaderExtended] = useState(false);
  const [zoomState, setZoomState] = useState({ transform:d3.zoomIdentity, manual:true });
  //refs
  const isFirstRender = useRef(true);
  const containerRef = useRef(null);
  const zoomGRef = useRef(null);
  const chartKeyRef = useRef(null);
  const chartKeySmallScreenRef = useRef(null);
  //store the actual zoom function so we can access its methods to get/set the transform
  const zoomRef = useRef(null);
  const simRef = useRef(null);

  //helpers
  const chartMargin = (width, height) => ({ left:width * 0.1, right:width * 0.1, top:height * 0.1, bottom:height * 0.1 });
  const toggleHeaderExtended = e => {
    setHeaderExtended(prevState => !prevState);
  }

  //sizes
  useEffect(() => {
    //console.log("chartSizeUE...1")
    const chartSizes = calculateChartSizesAndGridLayout(containerRef.current, data.datapoints.length, CONTAINER_MARGIN, chartMargin);
    setSizes(chartSizes);
  },[data.datapoints.length])

  //resize listener
  useEffect(() => {
    //console.log("resizeUE...2")
    let resizeObserver = new ResizeObserver(() => { 
      const chartSizes = calculateChartSizesAndGridLayout(containerRef.current, data.datapoints.length, CONTAINER_MARGIN, chartMargin);
      setSizes(chartSizes);
    }); 
    resizeObserver.observe(containerRef.current);
  }, [data.datapoints.length]);

  //change the overall viz dataset (not just the datapoints)
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("dataKeyUE...3")
    setTimeout(() => {
      setSelectedQuadrantIndex(null);
      setSelectedChartKey("");
      if(zoomRef.current){ d3.select(containerRef.current).call(zoomRef.current.transform, d3.zoomIdentity); }
      setZoomState({ transform:d3.zoomIdentity, manual:true });
    }, TRANSITION_OUT.delay + TRANSITION_OUT.duration)
  },[data.key])

  //render chartkey
  useEffect(() => {
    const chartKeyData = data.categories;
    if(!chartKeyData){ return; }
    //call key
    d3.select(chartKeyRef.current)
      ?.datum(chartKeyData)
      .call(chartKey
        .width(240)
        .height(140)
        .margin({ left:20, right: 20, top: 20, bottom:20 })
        .selectedQuadrantIndex(selectedQuadrantIndex)
        .setSelectedQuadrantIndex(setSelectedQuadrantIndex));

    d3.select(chartKeySmallScreenRef.current)
      ?.datum(chartKeyData)
      .call(chartKeySmallScreen
        .width(190)
        .height(100)
        .margin({ left:10, right: 20, top: 20, bottom:20 })
        .selectedQuadrantIndex(selectedQuadrantIndex)
        .setSelectedQuadrantIndex(setSelectedQuadrantIndex));

  }, [selectedQuadrantIndex, data.categories])

  //note- this useEffect may be neede don first render, if a selectedChartKey is passed in
  useEffect(() => {
    //console.log("selectedChartKeyUE...4")
    chart.selectedChartKey(selectedChartKey)
    //user deselects by zooming or panning manually, so no need to do anything here in that case
    if(!selectedChartKey){ return; }
    const chartD = d3.select(`#chart-${selectedChartKey}`).datum();
    //zoom into selected chart
    const k = d3.min([sizes.contentsWidth/sizes.chartWidth, sizes.contentsHeight/sizes.chartHeight]);
    const extraHorizSpace = sizes.contentsWidth - sizes.chartWidth * k;
    const extraVertSpace = sizes.contentsHeight - sizes.chartHeight * k;
    const x = -sizes.chartWidth * chartD.colNr * k + extraHorizSpace/2;
    const y = -sizes.chartHeight * chartD.rowNr * k + extraVertSpace/2;
    const transform = d3.zoomIdentity.translate(x, y).scale(k);
    setZoomState({ transform, manual:false });
    //note - if user pans or zooms away from it manually, then we immediately deselect chart,
    //as there are no other things that change when a chart is selected at present
  }, [selectedChartKey])

  //render/update chart
  useEffect(() => {
    if (isFirstRender.current || !sizes) { return; }
    //console.log("renderChartUE...5")
    //data
    const processedData = quadrantsBarChartLayout(data, { nrCols: sizes.nrCols });
    const processedDatapoints = processedData.datapoints;
    const { stdDevMin, stdDevRange } = processedData.info;

    const xAxisProperty = "stdDev"; //"datasetOrder"
    //@todo - try combining a forceX for the dataset order, and an attraction force manybody based on std dev similarity
    //force
    simRef.current = d3.forceSimulation(processedDatapoints);
    const sim = simRef.current;
    const extraMarginForForce = sizes.contentsWidth * 0.05;
    const horizSpace = sizes.contentsWidth - 2 * extraMarginForForce
    const vertSpace = sizes.contentsHeight - 2 * extraMarginForForce;
    const horizSpacePerChart = horizSpace/processedDatapoints.length;
    
    sim
    //add option to group by std dev on x axis instead of by datatset order eg date
      .force("x", d3.forceX(d => {
        if(xAxisProperty === "datasetOrder"){
          return (horizSpacePerChart) * d.i + extraMarginForForce;
        }
        if(xAxisProperty === "stdDev"){
          return horizSpace - (horizSpace * (d.info.stdDev - stdDevMin)/stdDevRange) + extraMarginForForce;
        }
        //default to centre of screen
        return sizes.containerWidth/2;
      })) 
      .force("y", d3.forceY(d => sizes.contentsHeight - (vertSpace * d.info.value/100) - extraMarginForForce))
      .force("collide", d3.forceCollide().radius(sizes.chartWidth * 0.5))
      //.tick(n_frames_to_simulate)

    sim.on("tick", () => 
      d3.select(containerRef.current).selectAll("g.chart")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
    )

    //settings
    chart
        .width(sizes.chartWidth)
        .height(sizes.chartHeight)
        .margin(sizes.chartMargin)
        .selectedQuadrantIndex(selectedQuadrantIndex)
        .setSelectedChartKey(setSelectedChartKey)
        .zoomState(zoomState)

    //call chart
    const visContentsG = d3.select(containerRef.current).selectAll("g.vis-contents")
      .attr("transform", `translate(${sizes.containerMargin.left}, ${sizes.containerMargin.top})`)

    const chartG = visContentsG.selectAll("g.chart").data(processedDatapoints, d => d.key);
    chartG.enter()
      .append("g")
        .attr("class", "chart")
        .attr("id", d => `chart-${d.key}`)
        .call(fadeIn, { transition:TRANSITION_IN})
        .merge(chartG)
        //.attr("transform", (d,i) => `translate(${d.colNr * sizes.chartWidth},${d.rowNr * sizes.chartHeight})`)
        .call(chart);

    chartG.exit().call(remove, { transition:TRANSITION_OUT})

  }, [sizes, selectedQuadrantIndex])

  //zoom set-up
  useEffect(() => {
    if (isFirstRender.current || !sizes) { return; }
    //console.log("zoomSetupUE...6")
    if(!zoomRef.current){ zoomRef.current = d3.zoom(); }
    zoomRef.current
      .scaleExtent([1, 100])
      .translateExtent([[0, 0], [sizes.containerWidth, sizes.containerHeight]])
      .on("zoom", e => { 
        //when user manually zooms, the selected chart is no longer selected
        if(e.sourceEvent){ setSelectedChartKey("")};
        setZoomState({ transform:e.transform, manual:true }); 
      })

    //call zoom
    d3.select(containerRef.current).call(zoomRef.current);
  },[sizes])

  //zoom change
  useEffect(() => {
    if (isFirstRender.current) { return; }
    //console.log("zoomChangeUE...7")
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

  return (
    <div className="viz-root">
      <div className={`viz-header ${headerExtended ? "extended" : ""}`}>
        <div className="viz-overview">
          <div className="title-and-description">
            <div className="viz-title">
              {data.title?.map((line, i) => 
                <div className="title-line" key={`title-line-${i}`}>{line}</div> )
              }
            </div>
            <div
              className={`desc-btn ${headerExtended ? "to-hide" : "to-show"}`}
              onClick={toggleHeaderExtended}
            >
              {`${headerExtended ? "Hide" : "Show"} Description`}
            </div>
            <div className={`viz-desc ${headerExtended ? "extended" : ""}`}>
              {data.desc?.map((line, i) => 
                <div className="desc-line" key={`desc-line-${i}`}>{line}</div> )
              }
            </div>
          </div>
          <div className="viz-info">
              {data.info && 
                <div className="visual-name">
                  <div className="label">{data.info.label}</div>
                  <div className="name">{data.info.name}</div>
                </div>
              }
              <div className="key key-sm-only">
                <svg ref={chartKeySmallScreenRef}></svg>
              </div>
          </div>
        </div>
        <div className="key key-above-sm">
          <svg ref={chartKeyRef}></svg>
        </div>
      </div>
      <div className={`viz-container ${headerExtended ? "with-extended-header" : ""}`} >
        <div className="viz-inner-container" ref={containerRef}>
          <svg className="viz" width="100%" height="100%">
            <g ref={zoomGRef}>
              <g className="vis-contents"></g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default QuadrantsBarChartVisual;


