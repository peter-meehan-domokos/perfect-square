'use client'
import { ReactElement } from 'react';
import PerfectSquare from '../perfect-square/page';
import SVGVisual from './SVGVisual/page';

/**
 * @description renders an SVGVisual Component, which follows a renderProps pattern, receiving as props the specific visual.
 * This component is therefore seam where the specific compoennt is injected into the application.
 * 
 * @returns {ReactElement} the SVGVisual component
 */
const Visual = () => {
    return (
      <SVGVisual 
        render={() => <PerfectSquare /> } 
      />
    )
}
  
export default Visual;