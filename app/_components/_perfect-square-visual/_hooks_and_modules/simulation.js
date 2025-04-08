import react, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from 'd3';

//constants
const COLLISION_FORCE_RADIUS_FACTOR = 1.15;
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE = 0.25
const EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE = 0.25
const CENTRE_FORCE_STRENGTH = 1.8;
const REDUCTION_FACTOR_FROM_CELL_SIZE = 0.6;

//helpers
const _simulationIsOn = arrangeBy => arrangeBy?.x || arrangeBy?.y || arrangeBy?.colour ? true : false;

const calcSizeReductionFactor = (nrNodes, arrangeBy) => {
  //@todo - apply a log scale instead so continually increases but never reaches limit
  const extraReductionForNodes = d3.min([0.1, 0.002 * nrNodes]);
  const nrNodesFactor = 1 - extraReductionForNodes;

  //if data is arranged but with no x an dy, it will form a group around centre, so need more space
  const extraReductionIfCentred = arrangeBy.colour && !arrangeBy.x && !arrangeBy.y ? 0.15 : 0;
  const centredFactor = 1 - extraReductionIfCentred;
  return nrNodesFactor * centredFactor * REDUCTION_FACTOR_FROM_CELL_SIZE;
}

const calcNodeDimensions = (cellWidth, cellHeight, nrNodes, arrangeBy) => {
  const factor = calcSizeReductionFactor(nrNodes, arrangeBy);
  return {
    nodeWidth:cellWidth * factor,
    nodeHeight:cellHeight * factor
  }
}

/**
 * @description A hook that sets up a d3.force simulation to act on data, making use of a helper function to apply the required forces
 * @param {Ref} containerRef a ref to the dom node on which to run the simulation
 * @param {object} data the data for the simulation, including a nodesData array
 * @param {} contentsWidth the width of the space that the simulation must fit into
 * @param {} contentsHeight the height of the space that the simulation must fit into
 * @param {} cellWidth the width of the node if it is in a normal grid display - which is the basis for the node width
 * @param {} cellHeight the height of the node if it is in a normal grid display - which is the basis for the node height
 * @param {} initSettings the initial settings (x,y,colour), which determine which simulation, if any, is on
 * 
 * @return {object} an object containing getter and setter for the settings, the node dimensions, and a simulationIsOn flag
 */
export const useSimulation = (containerRef, data, contentsWidth, contentsHeight, cellWidth, cellHeight, initSettings) => {
  const [settings, setSettings] = useState(initSettings || DEFAULT_SIMULATION_SETTINGS)
  
  const prevArrangeByRef = useRef(null);
  const simRef = useRef(null);
  const simIsStartedRef = useRef(false);
  const simTicksInProcessRef = useRef(false);

  const { arrangeBy } = settings;
  const simulationIsOn = _simulationIsOn(arrangeBy);
  const { nodesData, info } = data;

  const { nodeWidth, nodeHeight } = useMemo(() => calcNodeDimensions(cellWidth, cellHeight, nodesData.length, arrangeBy), 
    [cellWidth, cellHeight, nodesData.length, arrangeBy]);

  //simulation
  useEffect(() => {
    if(!simulationIsOn){ return; }
  
    //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
    const simulationWasAlreadyOn = _simulationIsOn(prevArrangeByRef.current);
    //update flag for next time
    prevArrangeByRef.current = arrangeBy;

    if(!simulationWasAlreadyOn){
      nodesData.forEach(d => {
        d.x = d.cellX;
        d.y = d.cellY;
      })
    }

    simRef.current = d3.forceSimulation(nodesData);
    applyForces(simRef.current, contentsWidth, contentsHeight, nodeWidth, nodeHeight, arrangeBy, nodesData.length, info);

    simRef.current
      .on("tick", () => {
        if(!simTicksInProcessRef.current){ simTicksInProcessRef.current = true; }
        if(!simIsStartedRef.current){ return; }
        d3.select(containerRef.current).select("g.viz-contents").selectAll("g.chart")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
      })
      .on("end", () => { simTicksInProcessRef.current = false; })

  }, [contentsWidth, contentsHeight, nodesData.length, arrangeBy, containerRef, info, nodeWidth, nodeHeight, nodesData, simulationIsOn])

  //start/stop sim
  useEffect(() => {
    if(!simulationIsOn){
      simRef.current?.stop();
      simIsStartedRef.current = false;
    }else{
      simRef.current?.restart();
      simIsStartedRef.current = true;
    }
  },[simulationIsOn])
  
  return { 
    simulationSettings:settings, 
    setSimulationSettings:setSettings,
    //use :   eg const { oldName: newName } = object to get it changed to nodeWidth and nodeheight
    nodeWidth,
    nodeHeight,
    simulationIsOn
  }

};


/**
 * @description Calculates and applies forces to the simulation for the required arrangeBy settings 
 *
 * @param {D3ForceSimulation} sim the d3 force simulation object
 * @param {Number} contentsWidth the width of the container, minus the margins (d3 margin convention)
 * @param {Number} contentsHeight the height of the container, minus the margins (d3 margin convention)
 * @param {Number} cellWidth the width of each individual chart
 * @param {Number} cellHeight the height of each individual chart
 * @param {object} arrangeBy contains the arrangement settings, with x, y and colour values potentially
 * @param {Number} nrNodes the number of nodesData/charts to display
 * @param {object} dataInfo meta information about all the nodesData eg mean, deviation
 * 
 */
function applyForces(sim, contentsWidth, contentsHeight, nodeWidth, nodeHeight, arrangeBy, nrNodes, dataInfo){
    const { mean, deviation } = dataInfo;
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
      .force("x", d3.forceX(d => {
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
          const proportion = mean.range === 0 ? 0.5 : (d.info.mean - mean.min)/mean.range;
          //when prop = 1 ie max chart, its off the screen, so need to adjust it back. This way, if prop=0, it will still be at the start of space
          return (horizSpace - horizSpacePerChart) * proportion + adjuster;
        }
        if(arrangeBy.x === "deviation"){
          //invert it by subtracting the proportion from 1 to get prop value
          const proportion = deviation.range === 0 ? 0.5 : 1 - (d.info.deviation - deviation.min)/deviation.range
          return (horizSpace - horizSpacePerChart) * proportion + adjuster;
        }
        //default to centre of screen
        return (contentsWidth - nodeWidth)/2;
      })) 
      .force("y", d3.forceY(d => {
        const adjuster = (vertSpacePerChart - nodeHeight)/2 - extraBottomMarginForForce;
        if(arrangeBy.y === "position" && d.date){
          //@todo - implement this similar to mean and deviation (and can just replace all 3 with d3 scales)
        }
        if(arrangeBy.y === "position"){
          return contentsHeight - (d.i + 1) * vertSpacePerChart + adjuster;
        }
        if(arrangeBy.y === "mean" && mean.range !== 0){
          const proportion = (d.info.mean - mean.min)/mean.range;
          return contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportion) + adjuster;
        }
        if(arrangeBy.y === "deviation" && deviation.range !== 0){
          const proportion = 1 - (d.info.deviation - deviation.min)/deviation.range;
          return contentsHeight - vertSpacePerChart - ((vertSpace - vertSpacePerChart) * proportion) + adjuster;
        }

        //default to centre of screen
        return (contentsHeight - nodeHeight)/2;
      }))

}