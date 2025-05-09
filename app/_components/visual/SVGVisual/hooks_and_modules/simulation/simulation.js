import { useEffect, useRef, useContext } from "react";
import * as d3 from 'd3';
import { VisualContext } from "../../../context";
import { SVGContainerContext } from "../../container";
import { _simulationIsOn } from "../../../helpers";

//constants
const COLLISION_FORCE_RADIUS_FACTOR = 1.15;
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE = 0.25
const EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE = 0.25
const CENTRE_FORCE_STRENGTH = 1.8;

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
export const useSimulation = (containerRef, data) => {
  const { 
    displaySettings: { arrangeBy }
  } = useContext(VisualContext);

  const { 
    container: { contentsWidth, contentsHeight }, 
    simulation
  } = useContext(SVGContainerContext);

  const nodeWidth = simulation?.nodeWidth || 0;
  const nodeHeight = simulation?.nodeHeight || 0;


  
  const prevArrangeByRef = useRef(null);
  const simRef = useRef(null);
  const simIsStartedRef = useRef(false);
  const simTicksInProcessRef = useRef(false);

  const simulationIsOn = _simulationIsOn(arrangeBy);
  const simulationWasAlreadyOn = _simulationIsOn(prevArrangeByRef.current);
  const simulationHasBeenTurnedOnOrOff = simulationIsOn !== simulationWasAlreadyOn;
  //update flag for next time
  prevArrangeByRef.current = arrangeBy;

  const { nodesData, info } = data;
  //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
  if(simulationIsOn && !simulationWasAlreadyOn){
    nodesData.forEach(d => {
      d.x = d.cellX;
      d.y = d.cellY;
    })
  }

  //simulation
  useEffect(() => {
    if(!simulationIsOn){ return; }
    simRef.current = d3.forceSimulation(nodesData);
    applyForces(simRef.current, contentsWidth, contentsHeight, nodeWidth, nodeHeight, arrangeBy, nodesData.length, info);

    simRef.current
      .on("tick", () => {
        if(!simTicksInProcessRef.current){ simTicksInProcessRef.current = true; }
        if(!simIsStartedRef.current){ return; }
        d3.select(containerRef.current).selectAll("g.chart")
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
    nodeWidth,
    nodeHeight,
    simulationIsOn,
    simulationHasBeenTurnedOnOrOff
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