'use client'
import { useContext, useRef, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { AppContext } from "@/app/context";
import { VisualContext } from "../context";
import SVGContainer from './container';
import ZoomableG from './hooks_and_modules/zoomable-g/page';

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {import('react').ReactNode} the PerfectSquareVisual component
 */
const SVGVisual = ({ render }) => {
  const { visualData:{ data }={} } = useContext(AppContext);
  const { setSelectedChartKey, setZoomTransformState, requiredZoomTransform } = useContext(VisualContext);

  //dimnsprov may not even need to store cell and node dimns, maybe just chartdimns, although that may trigger sim hook too often
  return (
    <SVGContainer withDimensions={true} withGridDimensions={true} withSimulationDimensions={true} >
      <ZoomableG 
        onZoomStart={() => { setSelectedChartKey(""); }}
        onZoom={setZoomTransformState}
      >
        {render()}
      </ZoomableG>
    </SVGContainer>
  )
}
  
export default SVGVisual;

/*
<ZoomableG>
    <Tooltips tooltipsData={tooltipsData} />
    {withDataChangeManagement(render)}
</ZoomableG>
*/