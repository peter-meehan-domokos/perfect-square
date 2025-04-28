'use client'
import ReactNode, { useRef, createContext, useContext, useMemo } from 'react';
import { useZoom } from '@/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/zoom';
import * as d3 from 'd3';
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
 * @description A component that implements full zoom functionality on a g, and provides a context that
 * contains the state aswell as some utility methods.
 *
 * @param {function} onZoomStart
 * @param {function} onZoom
 * @param {ReactNode} children 
 * @returns {ReactNode} the context provider, wrapping that zoom g that stores the d3 zoom behaviour,
 * which wraps a view g, on which the zooming transforms are applied (see d3.zoom docs)
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