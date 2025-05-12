'use client'
import { ReactElement, useContext } from 'react';
import { ZoomCallbacks } from "@/app/common-types/function-types";
import { VisualContext } from "../context";
import SVGContainer from './container';
import ZoomableG from './hooks_and_modules/zoomable-g/page';
import Tooltips from './hooks_and_modules/tooltips/page';

type SVGVisualProps = {
  render : () => ReactElement
}
/**
 * @description a complete component for a visual that will be rendered with svg (rather than html)
 *
 * @param {function} render a function that returns the main component for the specific visual
 * 
 * @returns {ReactElement} an SVGContainer component, wrapping a zoom component that wraps the visual,
 * and a Tooltips component, 
 */
const SVGVisual : React.FC<SVGVisualProps> = ({ render }) => {
  const { setSelectedChartKey, setZoomTransform } = useContext(VisualContext);
  
  const zoomCallbacks : ZoomCallbacks = {
    onStart : () => { setSelectedChartKey(""); },
    onZoom : (e) => setZoomTransform(e.transform)
  }
  return (
    <SVGContainer withGridDimensions={true} withSimulationDimensions={true} >
      <ZoomableG callbacks={zoomCallbacks}>
        {render()}
      </ZoomableG>
      <Tooltips />
    </SVGContainer>
  )
}
  
export default SVGVisual;