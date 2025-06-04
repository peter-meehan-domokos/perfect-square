'use client'
import React, { useEffect, useRef, useMemo, useContext } from 'react'
import { TooltipsContext } from './context';
import { SVGDimensionsContext } from '../../container';
import tooltipComponent from "./component";
import renderTooltips from "./renderTooltips";

/**
 * @description  
 * 
 * @returns {ReactElement} 
 */

const Tooltips = () => {
    const { 
        tooltipsData
    } = useContext(TooltipsContext);

    const { 
        container, 
    } = useContext(SVGDimensionsContext);

    //dom refs
    const containerRef = useRef(null);
    const tooltip = useMemo(() => tooltipComponent(), []);

    useEffect(() => {
      if(!container){ return; }
      const { contentsWidth, contentsHeight } = container;
      renderTooltips.call(containerRef.current, tooltipsData, tooltip, contentsWidth, contentsHeight);
    }, [container, tooltipsData, containerRef, container?.contentsWidth, container?.contentsHeight, tooltip])

  
  return (
    <g className="tooltips" ref={containerRef}></g>
  )
}

export default Tooltips;

