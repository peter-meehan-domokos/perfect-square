'use client'
import { useState, useEffect } from "react";
import { CONTAINER_MARGIN } from "../constants.js";
import { applyMargin } from '../helpers';
import { getElementDimns } from '@/app/_helpers/domHelpers';

export const useContainerDimensions = (containerRef) => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
        const { width, height } = getElementDimns.call(containerRef.current);
        setWidth(width);
        setHeight(height);
    };
    //init call
    updateDimensions();

    //resize listener
    let resizeObserver = new ResizeObserver(() => { updateDimensions(); }); 
    resizeObserver.observe(containerRef.current);

    //cleanup
    return () => { resizeObserver.disconnect(); };
  },[])
  
  return applyMargin(width, height, CONTAINER_MARGIN)

};
