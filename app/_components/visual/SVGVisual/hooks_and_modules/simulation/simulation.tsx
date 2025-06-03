import { RefObject, useEffect, useRef, useContext, useMemo } from "react";
import * as d3 from 'd3';
import { PerfectSquareSimulationNodeDatum, PerfectSquareForceSimulation, SimulationData, 
  ArrangeBy, PerfectSquareDatapoint, DatasetMetadata, MeasureDataSummaryItem,
Container, SimulationDimensions } from "@/app/common-types/data-types";
import { VisualContext } from "../../../context";
import { SVGDimensionsContext } from "../../container";
import { _simulationIsOn } from "../../../helpers";
import { isActualNumber } from "@/app/_helpers/dataHelpers";
//constants
const COLLISION_FORCE_RADIUS_FACTOR = 1.15;
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE = 0.25
const EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE = 0.25
const CENTRE_FORCE_STRENGTH = 1.8;

interface UseSimulationFn {
  (
    containerRef : RefObject<SVGElement | SVGGElement | HTMLDivElement | null>,
    data : SimulationData | null
  ) : any
}

/**
 * @description A hook that sets up a d3.force simulation to act on data, making use of a helper function to apply the required forces
 * @param {Ref} containerRef a ref to the dom node on which to run the simulation
 * @param {object} data the data for the simulation, including a nodesData array
 * 
 * @return {object} an object containing getter and setter for the settings, the node dimensions, and a simulationIsOn flag
 */
export const useSimulation : UseSimulationFn = (containerRef, data) => {
  const { 
    displaySettings: { arrangeBy }
  } = useContext(VisualContext);

  const dimensions = useContext(SVGDimensionsContext);

  const prevArrangeByRef = useRef<ArrangeBy | null>(null);
  const simIsStartedRef = useRef(false);
  const simTicksInProcessRef = useRef(false);

  const simulationIsOn = _simulationIsOn(arrangeBy);
  const simulationWasAlreadyOn = _simulationIsOn(prevArrangeByRef.current);
  //update flag for next time
  prevArrangeByRef.current = arrangeBy;

  //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
  if(data && simulationIsOn && !simulationWasAlreadyOn){
    data.nodesData.forEach(d => {
      d.x = d.cellX;
      d.y = d.cellY;
    })
  }

  const simRef = useRef<PerfectSquareForceSimulation>(d3.forceSimulation());
  //simulation
  useEffect(() => {
    if(!data){ return; }
    if(!simulationIsOn || !dimensions.container || !dimensions.simulation){ return; }
    const { nodesData, metadata } = data;

    //sim forces
    simRef.current.nodes(nodesData);
    applyForces(simRef.current, dimensions.container, dimensions.simulation, arrangeBy, metadata);

    //handle tick events
    simRef.current
      .on("tick", () => {
        if(!simTicksInProcessRef.current){ simTicksInProcessRef.current = true; }
        if(!simIsStartedRef.current){ return; }
        
        //@todo - set the anonymous function as ValueFn of the correct type
        d3.select(containerRef.current).selectAll("g.chart")
        // @ts-ignore
          .attr("transform", (d : PerfectSquareDatapoint, i : number) =>  `translate(${d.x}, ${d.y})`)
      .on("end", () => { simTicksInProcessRef.current = false; })

      })
  //@todo - data on causes sim to run again when zoom changes. find a better design.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.container, dimensions.simulation, arrangeBy, data, simulationIsOn]);

  useEffect(() => {
    if(!simRef.current){ return; }
    //turn it on or off
    if(!simulationIsOn){
      simRef.current.stop();
      simIsStartedRef.current = false;
    }else{
      simRef.current.alpha(1).restart();
      simIsStartedRef.current = true;
    }
  }, [simulationIsOn, arrangeBy.x, arrangeBy.y])
  
  return { 
    simulationIsOn,
    //simulationHasBeenTurnedOnOrOff
  }

};

/**
 * @description Calculates and applies forces to the simulation for the required arrangeBy settings 
 *
 * @param {PerfectSquareForceSimulation} sim the d3 force simulation object
 * @param {Container} containerDimensions the width of the container, minus the margins (d3 margin convention)
 * @param {SimulationDimensions} simulationDimensions the height of the container, minus the margins (d3 margin convention)
 * @param {ArrangeBy} arrangeBy contains the arrangement settings, with x, y and colour values potentially
 * @param {Number} nrNodes the number of nodesData/charts to display
 * @param {object} dataMetadata metadata about all the nodesData eg mean, deviation
 * 
 */

function applyForces(
  //find the type of forcesimulation
  sim : PerfectSquareForceSimulation,
  containerDimensions : Container, 
  simulationDimensions : SimulationDimensions, 
  arrangeBy : ArrangeBy, 
  dataMetadata : DatasetMetadata<MeasureDataSummaryItem>
  ): void {
    const { contentsWidth, contentsHeight } = containerDimensions;
    const { nodeWidth, nodeHeight, nrNodes } = simulationDimensions;

    const { mean, deviation } = dataMetadata;
    if(!mean || !deviation) { return; }
    //2nd time called, range of deviation is undefined
    const extraHorizMarginForForce = contentsWidth * EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE;
    const extraTopMarginForForce = contentsHeight * EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE;
    const extraBottomMarginForForce = contentsHeight * EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE;
    const horizSpace = contentsWidth - 2 * extraHorizMarginForForce
    const vertSpace = contentsHeight - extraTopMarginForForce - extraBottomMarginForForce;
    const horizSpacePerChart = horizSpace/nrNodes;
    const vertSpacePerChart = vertSpace/nrNodes;

    sim
      .force("center", d3.forceCenter(contentsWidth / 2, contentsHeight/2).strength(CENTRE_FORCE_STRENGTH))
      .force("collide", d3.forceCollide().radius((nodeWidth/2) * COLLISION_FORCE_RADIUS_FACTOR))
      .force("x", d3.forceX((d) => {
        //need to centre each chart in its horizspaceperchart ie +(hozspacePerChart - nodeWidth)/2
        const adjuster = extraHorizMarginForForce + (horizSpacePerChart - nodeWidth)/2;
        if(arrangeBy.x === "position" && d.date){
          //@todo - implement this similar to mean and deviation (and can just replace all 3 with d3 scales)
          return 0;
        }
        if(arrangeBy.x === "position"){
          return horizSpacePerChart * d.i + adjuster;
        }
        if(arrangeBy.x === "mean"){
          //@todo - replace guards with call to isActualNumber and assert types after that
          //if(!isActualNumber())
          if(typeof d.metadata.mean !== "number" || typeof mean.min !== "number" || typeof mean.range !== "number"){ return 0; }
          if(isNaN(d.metadata.mean) || isNaN(mean.min) || isNaN(mean.range)){ return 0; }

          const proportionOfScreenLength = mean.range === 0 ? 0.5 : (d.metadata.mean - mean.min)/mean.range!;
          //when prop = 1 ie max chart, its off the screen, so need to adjust it back. This way, if prop=0, it will still be at the start of space
          return (horizSpace - horizSpacePerChart) * proportionOfScreenLength + adjuster;
        }
        if(arrangeBy.x === "deviation"){
          //@todo - replace guards with call to isActualNumber and assert types after that
          if(typeof d.metadata.deviation !== "number" || typeof deviation.min !== "number" || typeof deviation.range !== "number"){ return 0; }
          if(isNaN(d.metadata.deviation) || isNaN(deviation.min) || isNaN(deviation.range)){ return 0; }
          //invert it by subtracting the proportion from 1 to get prop value
          const proportionOfScreenLength = deviation.range === 0 ? 0.5 : 1 - (d.metadata.deviation - deviation.min)/deviation.range;
          return (horizSpace - horizSpacePerChart) * proportionOfScreenLength + adjuster;
        }
        //default to centre of screen
        return (contentsWidth - nodeWidth)/2;
      })) 
      .force("y", d3.forceY((d) => {
        const adjuster = (vertSpacePerChart - nodeHeight)/2 - extraBottomMarginForForce;
        if(arrangeBy.y === "position" && d.date){
          //@todo - implement this similar to mean and deviation (and can just replace all 3 with d3 scales)
        }
        if(arrangeBy.y === "position"){
          return contentsHeight - (d.i + 1) * vertSpacePerChart + adjuster;
        }
        if(arrangeBy.y === "mean"){
          //@todo - replace guards with call to isActualNumber and assert types after that
          if(typeof d.metadata.mean !== "number" || typeof mean.min !== "number" || typeof mean.range !== "number"){ return 0; }
          if(isNaN(d.metadata.mean) || isNaN(mean.min) || isNaN(mean.range)){ return 0; }

          const proportionOfScreenHeight = (d.metadata.mean - mean.min)/mean.range;
          return contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportionOfScreenHeight) + adjuster;
        }
        if(arrangeBy.y === "deviation"){
          //console.log("y force")
          //@todo - replace guards with call to isActualNumber and assert types after that
          if(typeof d.metadata.deviation !== "number" || typeof deviation.min !== "number" || typeof deviation.range !== "number"){ return 0; }
          if(isNaN(d.metadata.deviation) || isNaN(deviation.min) || isNaN(deviation.range)){ return 0; }

          const proportionOfScreenHeight = 1 - (d.metadata.deviation - deviation.min)/deviation.range;
          //console.log("ret yforce", contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportionOfScreenHeight) + adjuster)
          return contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportionOfScreenHeight) + adjuster;
        }

        //default to centre of screen
        return (contentsHeight - nodeHeight)/2;
      }))

}