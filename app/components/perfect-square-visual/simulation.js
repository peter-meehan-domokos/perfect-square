import * as d3 from 'd3';

const COLLISION_FORCE_RADIUS_FACTOR = 1.15;
const EXTRA_HORIZ_MARGIN_FACTOR_FOR_FORCE = 0.15;
const EXTRA_TOP_MARGIN_FACTOR_FOR_FORCE = 0.25
const EXTRA_BOTTOM_MARGIN_FACTOR_FOR_FORCE = 0.25
const CENTRE_FORCE_STRENGTH = 1.8;

export function setupSimulation(sim, contentsWidth, contentsHeight, chartWidth, chartHeight, arrangeBy, nrDatapoints, dataInfo){
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