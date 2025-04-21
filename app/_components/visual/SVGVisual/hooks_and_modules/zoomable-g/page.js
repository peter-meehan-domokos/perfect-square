'use client'
import ReactNode, { useRef, createContext } from 'react';
import { useZoom } from '@/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/zoom';
import * as d3 from 'd3';

const initZoomState = {
    zoomTransformState:d3.zoomIdentity, 
    zoomingInProgress:false, 
    zoomTo:() => {}, 
    resetZoom:() => {}, 
    isChartOnScreenChecker:() => true
}

export const ZoomContext = createContext(initZoomState);

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {ReactNode} the PerfectSquareVisual component
 */
const ZoomableG = ({ contentsWidth, contentsHeight, margin, cellWidth, cellHeight, onZoomStart, onZoom, children }) => {
    const zoomGRef = useRef(null);
    const viewGRef = useRef(null);

    //@todo - decide how to handle simulation changing chartWidth to nodeWidth - maybe have a Simulation Wrapper Component too
    //called <SimulationProvider> and have it above ZoomableG
    const simulationIsOn = false;
    //chart dimns and position accessors - use node sizes if simulation is on (ie arrangeBy has been set)
    const chartWidth = simulationIsOn ? nodeWidth : cellWidth;
    const chartHeight = simulationIsOn ? nodeHeight : cellHeight;
    const _chartX = simulationIsOn ? d => d.x : d => d.cellX;
    const _chartY = simulationIsOn ? d => d.y : d => d.cellY;

    const { 
        zoomTransformState, 
        zoomingInProgress, 
        zoomTo, 
        resetZoom, 
        isChartOnScreenChecker 
    } = useZoom(zoomGRef, viewGRef, contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX, _chartY, onZoomStart, onZoom);

    //expose the hooks values and utility functions as a context
    const context = {
        zoomTransformState, 
        zoomingInProgress, 
        zoomTo, 
        resetZoom, 
        isChartOnScreenChecker 
    }

    return (
        <ZoomContext.Provider value={context}>
            <g className="zoom" ref={zoomGRef}>
                <g className="view" ref={viewGRef}>
                    {children}
                </g>
            </g>
        </ZoomContext.Provider>
    )
}
  
export default ZoomableG;