'use client'
import React, { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3';
import VisualHeader from './visual-header/page';
import { quadrantsBarChartLayout } from './quadrantsBarChartLayout';
import quadrantsBarChart from "./quadrantsBarChartComponent";
import { remove, fadeIn } from '../../helpers/domHelpers';
import { DEFAULT_SETTINGS } from "./constants.js";

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

const calculateChartSizesAndGridLayout = (container, nrItems, arrangeBy, _containerMargin={}, _chartMargin={}) => {
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
  //flag
  const reductionForArrangement = arrangeBy.x || arrangeBy.y ? 0.35 : 1;
  const chartWidth = reductionForArrangement * contentsWidth / nrCols;
  const chartHeight = reductionForArrangement * contentsHeight / nrRows;
  const chartMarginValues = typeof _chartMargin === "function" ? _chartMargin(chartWidth, chartHeight) : _chartMargin;
  const chartMargin = { ...defaultMargin, ...chartMarginValues }

  return { 
    containerWidth, containerHeight, containerMargin, contentsWidth, contentsHeight,
    chartWidth, chartHeight, chartMargin, 
    nrRows, nrCols, nrCharts:nrItems 
  }
}

const chart = quadrantsBarChart();

const QuadrantsBarChartVisual = ({ data={ datapoints:[], info:{ } }, initSelectedChartKey="", initSettings }) => {
  //console.log("QuadsBarChart", data)
  //state
  const [headerExtended, setHeaderExtended] = useState(false);
  const [sizes, setSizes] = useState(null);
  const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
  const [selectedChartKey, setSelectedChartKey] = useState(initSelectedChartKey);
  const [zoomState, setZoomState] = useState({ transform:d3.zoomIdentity, manual:true });
  const [settings, setSettings] = useState(initSettings || DEFAULT_SETTINGS)
  //refs
  const isFirstRender = useRef(true);
  const containerRef = useRef(null);
  const zoomGRef = useRef(null);
  
  //store the actual zoom function so we can access its methods to get/set the transform
  const zoomRef = useRef(null);
  const simRef = useRef(null);
  //other data that doesnt trigger re-renders
  //const sizesRef = useRef(null);
  const processedDataRef = useRef(null);

  const { key, title, desc, info, categories, datapoints } = data

  const headerData = {
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
  console.log("Render chartwidth", sizes?.chartWidth)

  //sizes
  useEffect(() => {
    console.log("chartSizeUE...1")
    const chartSizes = calculateChartSizesAndGridLayout(containerRef.current, datapoints.length, settings.arrangeBy, CONTAINER_MARGIN, chartMargin);
    setSizes(chartSizes);
  },[datapoints.length, settings.arrangeBy])

  //resize listener
  useEffect(() => {
    console.log("resizeUE...2")
    let resizeObserver = new ResizeObserver(() => { 
      const chartSizes = calculateChartSizesAndGridLayout(containerRef.current, datapoints.length, settings.arrangeBy, CONTAINER_MARGIN, chartMargin);
      setSizes(chartSizes);
    }); 
    resizeObserver.observe(containerRef.current);
  }, [datapoints.length]);

  //change the overall viz dataset (not just the datapoints)
  useEffect(() => {
    if (isFirstRender.current) { return; }
    console.log("dataKeyChangeUE...3")
    setTimeout(() => {
      setSelectedQuadrantIndex(null);
      setSelectedChartKey("");
      if(zoomRef.current){ d3.select(containerRef.current).call(zoomRef.current.transform, d3.zoomIdentity); }
      setZoomState({ transform:d3.zoomIdentity, manual:true });
    }, TRANSITION_OUT.delay + TRANSITION_OUT.duration)
  },[key])

  //reset zoom if user changes arrangement
  useEffect(() => {
    setZoomState({ transform:d3.zoomIdentity, manual:false });
  },[settings.arrangeBy])

  //note- this useEffect may be neede don first render, if a selectedChartKey is passed in
  useEffect(() => {
    console.log("selectedChartKeyUE...4")
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

  //layout applied to data
  useEffect(() => {
    if (isFirstRender.current || !sizes) { return; }
    console.log("layoutUE...5")
    processedDataRef.current = quadrantsBarChartLayout(data, { nrCols: sizes.nrCols });
  }, [data.key, data.datapoints, sizes?.nrCols])

  //simulation
  useEffect(() => {
    if (isFirstRender.current || !sizes) { return; }
    //CHECK - do we need anyting in here to run if arrangement is turned off!!!!!!!!!!!!
    //@todo - used this, no need to setup the sim if !dataIsArraged
    const dataIsArranged = settings.arrangeBy.x || settings.arrangeBy.y;
    if(!dataIsArranged){ return; }
    console.log("simUE...6")

    const processedData = processedDataRef.current;
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

  }, [settings.arrangeBy])
  //render/update chart
  useEffect(() => {
    if (isFirstRender.current || !sizes) { return; }
    console.log("renderChartUE...7")
    const dataIsArranged = settings.arrangeBy.x || settings.arrangeBy.y ? true : false;
    //data
    const processedData = processedDataRef.current;
    const processedDatapoints = processedData.datapoints;
    //next - if remving arrangement, must go back to grid, so must remove nide.x and y values??
    //also, bug when adding a 2nd arrangement..bars are too big..its to do with the orer things happen
    //this is the order we need
    /*
    - user removes x arrangement
    - chart size recalculated -> sizes state updated
      - chart re-rendered, with sim.stop() and new tranform appliied via selection.transform
        (also need to move sim stuff into separate useEffect..it doesnt need to run every time, only when arrangeBy changes)
    */
    if(!dataIsArranged){
      simRef.current?.stop();
    }else{
      simRef.current?.restart();
    }

    //settings
    chart
        .width(sizes.chartWidth)
        .height(sizes.chartHeight)
        .margin(sizes.chartMargin)
        .selectedQuadrantIndex(selectedQuadrantIndex)
        .setSelectedChartKey(setSelectedChartKey)
        .zoomState(zoomState)
        .arrangeBy(settings.arrangeBy)

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
        .attr("transform", (d,i) => dataIsArranged ? null : `translate(${d.colNr * sizes.chartWidth},${d.rowNr * sizes.chartHeight})`)
        .call(chart);

    chartG.exit().call(remove, { transition:TRANSITION_OUT})

  }, [sizes, selectedQuadrantIndex, settings.arrangeBy])

  //zoom set-up
  useEffect(() => {
    if (isFirstRender.current || !sizes) { return; }
    console.log("zoomSetupUE...8")
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
    console.log("zoomChangeUE...9")
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
      <VisualHeader 
        data={headerData} 
        settings={settings}
        zoomScaleValue={zoomState.transform.k}
        headerExtended={headerExtended} 
        setHeaderExtended={setHeaderExtended} 
        selectedQuadrantIndex={selectedQuadrantIndex}
        setSelectedQuadrantIndex={setSelectedQuadrantIndex}
        setSettings={setSettings}
      />
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


