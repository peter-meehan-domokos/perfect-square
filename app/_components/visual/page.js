'use client'
import { useContext } from 'react';
import { AppContext } from "@/app/context";
import { VisualContext } from "../visual/context";
import PerfectSquare from '../perfect-square/page';
import SVGVisual from './SVGVisual/page';
import { NoDataFallback } from '../utility/fallbacks/page';

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {import('react').ReactNode} the PerfectSquareVisual component
 */
const Visual = ({  }) => {
  const { visualData:{ data, loading, error } = {}} = useContext(AppContext);
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

or

<NoDataFallback
  data={data}
  loading={loading} 
  error={error}
  fallback = {(loading, error) => <h3>No Data</h3>}
>
  <PerfectSquare 
    contentsWidth={contentsWidth}
    contentsHeight={contentsHeight}
    grid={grid}
  />
</NoDataFallback> 

*/