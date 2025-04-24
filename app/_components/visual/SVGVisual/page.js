'use client'
import { useContext } from 'react';
import { AppContext } from "@/app/context";
import { VisualContext } from "../context";
import SVGContainer from './container';
import ZoomableG from './hooks_and_modules/zoomable-g/page';
import Tooltips from './hooks_and_modules/tooltips/page';

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
    <SVGContainer withGridDimensions={true} withSimulationDimensions={true} >
      <ZoomableG 
        onZoomStart={() => { setSelectedChartKey(""); }}
        onZoom={setZoomTransformState}
      >
        {render()}
      </ZoomableG>
      <Tooltips />
    </SVGContainer>
  )
}
  
export default SVGVisual;