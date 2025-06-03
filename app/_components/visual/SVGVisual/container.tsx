'use client'
import { useContext, useRef, useMemo, createContext, PropsWithChildren } from 'react';
import { Grid, SimulationDimensions, Container, ContainerWithDatapointPositioning } from '@/app/common-types/data-types';
import { AppContext } from '@/app/context';
import { VisualContext } from "../context";
import useContainerDimensions from './hooks_and_modules/useContainerDimensions';
import calcGrid from './hooks_and_modules/grid';
import { _simulationIsOn } from '../helpers';
import { calcSimulationNodeDimensions } from "./helpers";
import { applyMargin } from '../../perfect-square/helpers';

interface SVGContainerProps {
    withGridDimensions : boolean, 
    withSimulationDimensions : boolean
}

interface SVGDimensionsContext {
    container : Container | null,
    grid : Grid | null,
    simulation : SimulationDimensions | null,
    chart : ContainerWithDatapointPositioning | null
}

const defaultSVGDimensionsContext : SVGDimensionsContext = {
    container:null,
    grid:null,
    simulation:null,
    chart:null
}

export const SVGDimensionsContext = createContext(defaultSVGDimensionsContext);

/**
 * @description A component that renders an svg that takes up all available space and calculates its dimensions.
 * Optionally provides other layout-related dimensional info through context.
 *
 * @param {Object} props - The component props
 * @param {boolean} [props.withGridDimensions=false] - If true, the context will store information required for rendering 
 * a grid of datapoints, with optimized rows and columns for maximum space utilization
 * @param {boolean} [props.withSimulationDimensions=true] - If true, the context will contain nodeWidth and nodeHeight values
 * for a simulation of datapoints, sized to fit all datapoints on screen
 * @param {import('react').ReactNode} props.children - The content to render within the SVG container
 * 
 * @returns {import('react').ReactElement} The context provider wrapping the SVG element
 */

//@todo - remove the div and just use the svg
const SVGContainer : React.FC<PropsWithChildren<SVGContainerProps>> = ({ 
    withGridDimensions = false, 
    withSimulationDimensions = true, 
    children 
}) => {
    const { visualDataResult:{ data } } = useContext(AppContext);
    const { displaySettings: { arrangeBy } } = useContext(VisualContext);

    const dataExists = data && data !== null ? true : false;
    //Consumer can use data itself as a single datapoint, instead of passing a datapoints property
    const nrDatapoints = data?.datapoints.length || (dataExists ? 1 : 0)

    const containerDivRef = useRef(null);
    const container = useContainerDimensions(containerDivRef.current);

    //if consumer just needs a simulation, then grid is still needed to calculate the simulation dimensions
    const needGrid = withGridDimensions || withSimulationDimensions;
    const grid = useMemo(() => {
        if(!container || !needGrid || !dataExists){ 
            return null; 
        }
        return calcGrid(container.contentsWidth, container.contentsHeight, nrDatapoints)
    }, 
    [needGrid, container, nrDatapoints, dataExists]);

    //need grid for simulaiotn, because node sizes are based on it
    const simulation = useMemo(() => {
        if(!withSimulationDimensions || !grid){
            return null;
        }
        return calcSimulationNodeDimensions(grid.cellWidth, grid.cellHeight, grid.nrCells, arrangeBy);
    },
    [withSimulationDimensions, grid, arrangeBy]);

    const simulationIsOn = useMemo(() => _simulationIsOn(arrangeBy) && simulation ? true : false, [arrangeBy, simulation]);
    const chartContainer = useMemo(() => {
        if(!grid) { return null; }
        //chart dimns and position accessors - use node sizes if simulation is on (ie arrangeBy has been set)
        const width = simulationIsOn && simulation?.nodeWidth ? simulation.nodeWidth : grid.cellWidth;
        const height = simulationIsOn && simulation?.nodeHeight ? simulation.nodeHeight : grid.cellHeight;
        return applyMargin(width, height, grid.cellMargin);
    },[simulationIsOn, simulation, grid])

    const chart : ContainerWithDatapointPositioning | null = !chartContainer ? null : {
        ...chartContainer,
        //each positionedDatapoint is guaranteed to have cellX and cellY values
        _x : d => simulationIsOn && d.x ? d.x : d.cellX,
        _y : d => simulationIsOn && d.y ? d.y : d.cellY
    }
    
    const context = {
        container,
        grid,
        simulation,
        chart
    } 

    return (
        <SVGDimensionsContext.Provider value={context} >
            <div className="vis-layout" ref={containerDivRef}>
                <svg className="vis" 
                    transform={`translate(${container?.margin.left || 0}, ${container?.margin.top || 0})`}
                    width={`${container?.contentsWidth || 0}px`} 
                    height={`${container?.contentsHeight || 0}px`}  >
                    {children}
                    <defs>
                        <clipPath id="slide-tooltip-clip">
                            <rect></rect>
                        </clipPath>
                    </defs>
                </svg>
            </div>
        </SVGDimensionsContext.Provider>
    )
}
  
export default SVGContainer;