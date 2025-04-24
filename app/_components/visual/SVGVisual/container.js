'use client'
import { useContext, useRef, useMemo, useEffect, createContext, useCallback } from 'react';
import * as d3 from 'd3';
import { AppContext } from '@/app/context';
import { VisualContext } from "../context";
import { useSVGContainerContext } from './hooks_and_modules/containerDimensions';
import calcGrid from './hooks_and_modules/grid';
import { _simulationIsOn } from '../helpers';

const calcSizeReductionFactor = (nrNodes, arrangeBy) => {
    const REDUCTION_FACTOR_FROM_CELL_SIZE = 0.6;
    //@todo - apply a log scale instead so continually increases but never reaches limit
    const extraReductionForNodes = d3.min([0.1, 0.002 * nrNodes]);
    const nrNodesFactor = 1 - extraReductionForNodes;
  
    //if data is arranged but with no x an dy, it will form a group around centre, so need more space
    const extraReductionIfCentred = arrangeBy.colour && !arrangeBy.x && !arrangeBy.y ? 0.15 : 0;
    const centredFactor = 1 - extraReductionIfCentred;
    return nrNodesFactor * centredFactor * REDUCTION_FACTOR_FROM_CELL_SIZE;
}

const calcSimulationNodeDimensions = (cellWidth, cellHeight, nrNodes, arrangeBy) => {
    const factor = calcSizeReductionFactor(nrNodes, arrangeBy);
    return {
      nodeWidth:cellWidth * factor,
      nodeHeight:cellHeight * factor
    }
}

const defaultSVGContainerContext = {
    container:{ width:0, height:0 },
    grid:null,
    simulation:null,
    chart:null
}

export const SVGContainerContext = createContext(defaultSVGContainerContext);

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {import('react').ReactNode} the PerfectSquareVisual component
 */

//@todo - remove the div and just use the svg
const SVGContainer = ({ withGridDimensions=false, withSimulationDimensions=true, children }) => {
    const { visualData:{ data } } = useContext(AppContext);
    const { displaySettings: { arrangeBy } = {} } = useContext(VisualContext);

    const dataExists = data && data !== null;
    //Consumer can use data itself as a single datapoint, instead of passing a datapoints property
    const nrDatapoints = data?.datapoints.length || (dataExists ? 1 : 0)

    const containerDivRef = useRef(null);
    const container = useSVGContainerContext(containerDivRef);
    const { contentsWidth, contentsHeight, margin } = container;

    //if consumer just needs a simulation, then grid is still needed to calculate the simulation dimensions
    const needGrid = withGridDimensions || withSimulationDimensions;
    const grid = useMemo(() => needGrid && dataExists ? calcGrid(contentsWidth, contentsHeight, nrDatapoints) : null, 
        [withGridDimensions, contentsWidth, contentsHeight, nrDatapoints, dataExists]);

    const simulation = useMemo(() => withSimulationDimensions && grid?.cellWidth ? calcSimulationNodeDimensions(grid.cellWidth, grid.cellHeight, nrDatapoints, arrangeBy) : null, 
        [withSimulationDimensions, grid?.cellWidth, grid?.cellHeight, nrDatapoints, arrangeBy]);

    const calcChartDimns = useCallback(() => {
        const simulationIsOn = _simulationIsOn(arrangeBy) && simulation ? true : false;
        //chart dimns and position accessors - use node sizes if simulation is on (ie arrangeBy has been set)
        const width = simulationIsOn && simulation?.nodeWidth ? simulation.nodeWidth : grid.cellWidth;
        const height = simulationIsOn && simulation?.nodeHeight ? simulation.nodeHeight : grid.cellHeight;
        const margin = grid.cellMargin;
        const _x = simulationIsOn ? d => d.x : d => d.cellX;
        const _y = simulationIsOn ? d => d.y : d => d.cellY;
        return { width, height, margin, _x, _y }
    },[arrangeBy, simulation, grid])

    const chart = grid ? calcChartDimns() : null;
    
    const context = {
        container,
        grid: withGridDimensions ? grid : null,
        simulation,
        chart
    } 

    return (
        <SVGContainerContext.Provider value={context} >
            <div className="vis-layout" ref={containerDivRef}>
                <svg className="vis" 
                    transform={`translate(${margin.left}, ${margin.top})`}
                    width={`${contentsWidth}px`} 
                    height={`${contentsHeight}px`}  >
                    {children}
                </svg>
            </div>
        </SVGContainerContext.Provider>
    )
}
  
export default SVGContainer;