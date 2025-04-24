'use client'
import { ReactNode, useContext } from 'react';
import { VisualContext } from "../context";
import SVGContainer from './container';
import ZoomableG from './hooks_and_modules/zoomable-g/page';
import Tooltips from './hooks_and_modules/tooltips/page';

/**
 * @description a complete component for a visual that will be rendered with svg (rather than html)
 *
 * @param {function} render a function that returns the main component for the specific visual
 * 
 * @returns {ReactNode} an SVGContainer component, wrapping a zoom component that wraps the visual,
 * and a Tooltips component, 
 */
const SVGVisual = ({ render }) => {
  const { setSelectedChartKey, setZoomTransformState } = useContext(VisualContext);
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