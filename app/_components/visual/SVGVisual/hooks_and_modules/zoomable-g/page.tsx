'use client'
import ReactElement, { useRef, createContext, useContext, useMemo, PropsWithChildren } from 'react';
import { ZoomTransform, D3ZoomEvent, ZoomedElementBaseType } from "d3-zoom";
import { PositionedDatapoint, Transition } from '@/app/common-types/data-types';
import { HandlerFn, HandlerFnWithNoArgs, ZoomCallbacks } from '@/app/common-types/function-types';
import { useZoom } from '@/app/_components/visual/SVGVisual/hooks_and_modules/zoomable-g/zoom';
import * as d3 from 'd3';
import { SVGDimensionsContext } from '../../container';

export interface ZoomingInProgress {
    targK : number,
    sourceEvent : D3ZoomEvent<ZoomedElementBaseType, PositionedDatapoint> | null
}

export interface ZoomContext {
    zoomTransform : ZoomTransform,
    zoomingInProgress : ZoomingInProgress | null,
    applyZoom : (t: ZoomTransform, trans: Transition, cb:HandlerFnWithNoArgs) => void
    zoomTo : (d : PositionedDatapoint, callback : HandlerFnWithNoArgs) => void;
    resetZoom : HandlerFn<boolean>,
    isChartOnScreenChecker: (d : PositionedDatapoint) => boolean
}

const cb = () => {};
const initZoomContext : ZoomContext = {
    zoomTransform : d3.zoomIdentity, 
    zoomingInProgress : null, 
    applyZoom:() => {},
    zoomTo:() => {}, 
    resetZoom:() => {}, 
    isChartOnScreenChecker:() => true
}

export const ZoomContext = createContext(initZoomContext);

interface ZoomableGProps {
    callbacks : ZoomCallbacks
}

/**
 * @description A component that implements full zoom functionality on a g, and provides a context that
 * contains the state aswell as some utility methods.
 *
 * @param {function} zoomCallbacks
 * @param {ReactElement} children 
 * @returns {ReactElement} the context provider, wrapping that zoom g that stores the d3 zoom behaviour,
 * which wraps a view g, on which the zooming transforms are applied (see d3.zoom docs)
 */
const ZoomableG : React.FC<PropsWithChildren<ZoomableGProps>> = ({ 
    callbacks,
    children 
}) => {
    const { 
        container, 
        chart
    } = useContext(SVGDimensionsContext);

    const zoomBehaviourGRef = useRef<SVGGElement | null>(null);
    const viewGRef = useRef<SVGGElement | null>(null);
    //note - the typechecker doesnt check signature of context functions here, these are checked and 
    //reported in useZoom itself (here, it knows useZoom returns a ZoomContext, and thats all it needs to know)
    const context = useZoom(zoomBehaviourGRef, viewGRef, container, chart, callbacks);
    return (
        <ZoomContext.Provider value={context}>
            <g className="zoom" ref={zoomBehaviourGRef}>
                <g className="view" ref={viewGRef}>
                    {children}
                </g>
            </g>
        </ZoomContext.Provider>
    )
}
  
export default ZoomableG;