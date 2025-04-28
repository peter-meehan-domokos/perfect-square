'use client'
import React, { useEffect, useRef, useMemo, useContext } from 'react'
import { TooltipsContext } from './context';
import { SVGContainerContext } from '../../container';
import tooltipComponent from "./component";
import renderTooltips from "./renderTooltips";

/**
 * @description  
 * 
 * @returns {HTMLElement} 
 */

const Tooltips = () => {
    const { 
        tooltipsData
    } = useContext(TooltipsContext);

    const { 
        container: { contentsWidth, contentsHeight }, 
    } = useContext(SVGContainerContext);

    //dom refs
    const containerRef = useRef(null);
    const tooltip = useMemo(() => tooltipComponent(), []);

    useEffect(() => {
        renderTooltips.call(containerRef.current, tooltipsData, tooltip, contentsWidth, contentsHeight);
    }, [tooltipsData, containerRef, contentsWidth, contentsHeight, tooltip])

  
  return (
    <g className="tooltips" ref={containerRef}></g>
  )
}

export default Tooltips;

