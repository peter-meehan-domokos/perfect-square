'use client'
import { useState, useEffect } from "react";
import { DEFAULT_CONTAINER_MARGIN } from "../../../perfect-square/constants.js";
import { applyMargin } from '../../../perfect-square/helpers';
import { getElementDimns } from '@/app/_helpers/domHelpers';

/**
 * @description A hook that calculates the dimensions of the given element and sets up a listener for any changes to it 
 * @param {Ref} containerRef a ref to the element
 * 
 * @return {object} the dimensions - width, height, margin, contentsWidth, contentsHeight
 */
export const useSVGContainerContext = (containerRef, margin) => {
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
  },[containerRef])
  
  return applyMargin(width, height, margin || DEFAULT_CONTAINER_MARGIN)

};
