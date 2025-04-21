'use client'
import ReactNode, { useRef } from 'react';
import { useZoom } from '@/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/zoom';

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

    const context = {
        
    }
    return (
        <g className="zoom" ref={zoomGRef}>
            <g className="view" ref={viewGRef}>
                {children}
            </g>
        </g>
    )
}
  
export default ZoomableG;