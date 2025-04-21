'use client'
import { useContext, useRef, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { AppContext } from "@/app/context";
import { VisualContext } from "../context";
import { useContainerDimensions } from './hooks_and_modules/containerDimensions';
import calcGrid from './hooks_and_modules/grid';
import ZoomableG from './hooks_and_modules/zoomable-g/page';

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {import('react').ReactNode} the PerfectSquareVisual component
 */
const SVGVisual = ({ render, withGrid=true }) => {
  const { visualData:{ data }={} } = useContext(AppContext);
  const { setSelectedChartKey, setZoomTransformState, requiredZoomTransform } = useContext(VisualContext);

  const containerDivRef = useRef(null);

  //container dimensions
  const { contentsWidth, contentsHeight, margin } = useContainerDimensions(containerDivRef);

  //grid
  const grid = useMemo(() => withGrid ? calcGrid(contentsWidth, contentsHeight, data?.datapoints?.length) : undefined, 
      [withGrid, contentsWidth, contentsHeight, data?.datapoints?.length]);

  //@todo - consider adding cellX and cellY to datapoints in here rather than in perfectSquareLayout..this seems ot be the logical
  //location for it

  //position the contentsG
  useEffect(() => {
      d3.select(containerDivRef.current).select("svg")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
  }, [margin])


  return (
    <div className="vis-layout" ref={containerDivRef}>
      <svg className="vis" width="100%" height="100%" >
        <ZoomableG 
          contentsWidth={contentsWidth} 
          contentsHeight={contentsHeight} 
          margin={margin} 
          cellWidth={grid.cellWidth}
          cellHeight={grid.cellHeight}
          onZoomStart={() => { setSelectedChartKey(""); }}
          onZoom={setZoomTransformState}
        >
          {render(contentsWidth, contentsHeight, grid)}
        </ZoomableG>
      </svg>
    </div>
  )
}
  
export default SVGVisual;

/*
<ZoomableG>
    <Tooltips tooltipsData={tooltipsData} />
    {withDataChangeManagement(render)}
</ZoomableG>
*/