'use client'
import { useContext } from 'react';
import { AppContext } from "@/app/context";
import { VisualContext } from "../visual/context";
import PerfectSquare from '../perfect-square/page';
import SVGVisual from './SVGVisual/page';

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {import('react').ReactNode} the PerfectSquareVisual component
 */
const Visual = ({  }) => {
  const { } = useContext(AppContext);
  const { } = useContext(VisualContext);

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

/*
<LoadingFallback>
  <ErrorBoundary>
  </ErrorBoundary>
</LoadingFallback>

*/