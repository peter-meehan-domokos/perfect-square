import { useEffect, useRef } from "react";
import * as d3 from 'd3';
import { isArranged } from './helpers';

const COLLISION_FORCE_RADIUS_FACTOR = 1.15;
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE = 0.25
const EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE = 0.25
const CENTRE_FORCE_STRENGTH = 1.8;

export const useSimulation = (containerRef, data, contentsWidth, contentsHeight, chartWidth, chartHeight, arrangeBy, prevArrangeByRef) => {
  const simRef = useRef(null);
  const simIsStartedRef = useRef(false);
  const simTicksInProcessRef = useRef(false);

  const dataIsArranged = isArranged(arrangeBy);
  const { datapoints=[], info } = data;

  //simulation
  useEffect(() => {
    if(!dataIsArranged){ return; }
  
    //if moving from a grid (ie non-arranged), we set d.x and d.y properties so transitions starts from current position
    const dataWasAlreadyArranged = isArranged(prevArrangeByRef.current);
    if(!dataWasAlreadyArranged){
      datapoints.forEach(d => {
        d.x = d.cellX;
        d.y = d.cellY;
      })
    }

    simRef.current = d3.forceSimulation(datapoints);
    setupSimulation(simRef.current, contentsWidth, contentsHeight, chartWidth, chartHeight, arrangeBy, datapoints.length, info);

    simRef.current
      .on("tick", () => {
        if(!simTicksInProcessRef.current){ simTicksInProcessRef.current = true; }
        if(!simIsStartedRef.current){ return; }
        d3.select(containerRef.current).select("g.viz-contents").selectAll("g.chart")
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
      })
      .on("end", () => { simTicksInProcessRef.current = false; })

  }, [contentsWidth, contentsHeight, datapoints.length, arrangeBy])

  //start/stop sim
  useEffect(() => {
    if(!dataIsArranged){
      simRef.current?.stop();
      simIsStartedRef.current = false;
    }else{
      simRef.current?.restart();
      simIsStartedRef.current = true;
    }
  },[arrangeBy])
  
  return {  }

};


/**
 * @description Calculates and applies forces to the simulation for the required arrangeBy settings 
 *
 * @param {D3ForceSimulation} sim the d3 force simulation object
 * @param {Number} contentsWidth the width of the container, minus the margins (d3 margin convention)
 * @param {Number} contentsHeight the height of the container, minus the margins (d3 margin convention)
 * @param {Number} chartWidth the width of each individual chart
 * @param {Number} chartHeight the height of each individual chart
 * @param {object} arrangeBy contains the arrangement settings, with x, y and colour values potentially
 * @param {Number} nrDatapoints the number of datapoints/charts to display
 * @param {object} dataInfo meta information about all the datapoints eg mean, deviation
 * 
 */
function setupSimulation(sim, contentsWidth, contentsHeight, chartWidth, chartHeight, arrangeBy, nrDatapoints, dataInfo){
    const { mean, deviation } = dataInfo;
    const extraHorizMarginForForce = contentsWidth * EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE;
    const extraTopMarginForForce = contentsHeight * EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE;
    const extraBottomMarginForForce = contentsHeight * EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE;
    const horizSpace = contentsWidth - 2 * extraHorizMarginForForce
    const vertSpace = contentsHeight - extraTopMarginForForce - extraBottomMarginForForce;
    const horizSpacePerChart = horizSpace/nrDatapoints;
    const vertSpacePerChart = vertSpace/nrDatapoints;

    sim
      .force("center", d3.forceCenter(contentsWidth / 2, contentsHeight/2).strength(CENTRE_FORCE_STRENGTH))
      .force("collide", d3.forceCollide().radius((chartWidth/2) * COLLISION_FORCE_RADIUS_FACTOR))
      .force("x", d3.forceX(d => {
        //need to centre each chart in its horizspaceperchart ie +(hozspacePerChart - chartWidth)/2
        const adjuster = extraHorizMarginForForce + (horizSpacePerChart - chartWidth)/2;
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
        return (contentsWidth - chartWidth)/2;
      })) 
      .force("y", d3.forceY(d => {
        const adjuster = (vertSpacePerChart - chartHeight)/2 - extraBottomMarginForForce;
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
        return (contentsHeight - chartHeight)/2;
      }))

}