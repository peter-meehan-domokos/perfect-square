'use client'
import ReactNode, { useRef, createContext, useContext, useMemo } from 'react';
import { useZoom } from '@/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/zoom';
import * as d3 from 'd3';
import { VisualContext } from '../../../context';
import { SVGContainerContext } from '../../container';

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
const ZoomableG = ({ onZoomStart, onZoom, children }) => {
    const { 
        container: { margin, contentsWidth, contentsHeight }, 
        chart
    } = useContext(SVGContainerContext);

    const zoomGRef = useRef(null);
    const viewGRef = useRef(null);

    const context = useZoom(zoomGRef, viewGRef, contentsWidth, contentsHeight, margin, chart?.width, chart?.height, chart?._x, chart?._y, onZoomStart, onZoom);

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