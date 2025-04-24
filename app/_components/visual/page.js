'use client'
import { ReactNode } from 'react';
import PerfectSquare from '../perfect-square/page';
import SVGVisual from './SVGVisual/page';

/**
 * @description renders an SVGVisual Component, which follows a renderProps pattern, receiving as props the specific visual.
 * This component is therefore seam where the specific compoennt is injected into the application.
 * 
 * @returns {ReactNode} the SVGVisual component
 */
const Visual = () => {
    return (
      <SVGVisual 
        render={(contentsWidth, contentsHeight, grid) =>
          <PerfectSquare 
            contentsWidth={contentsWidth}
            contentsHeight={contentsHeight}
            grid={grid}
          /> 
        } 
      />
    )
}
  
export default Visual;