import { SimulationDimensions, ArrangeBy } from '@/app/_components/perfect-square/types';
import * as d3 from 'd3';

const calcSizeReductionFactor = (nrNodes : number, arrangeBy : ArrangeBy) => {
    const REDUCTION_FACTOR_FROM_CELL_SIZE = 0.6;
    //@todo - apply a log scale instead so continually increases but never reaches limit
    const extraReductionForNodes = d3.min([0.1, 0.002 * nrNodes]) || 0;
    const nrNodesFactor = 1 - extraReductionForNodes;
  
    //if data is arranged but with no x an dy, it will form a group around centre, so need more space
    const extraReductionIfCentred = arrangeBy.colour && !arrangeBy.x && !arrangeBy.y ? 0.15 : 0;
    const centredFactor = 1 - extraReductionIfCentred;
    return nrNodesFactor * centredFactor * REDUCTION_FACTOR_FROM_CELL_SIZE;
}

export const calcSimulationNodeDimensions = (
  cellWidth : number, 
  cellHeight : number, 
  nrNodes : number, 
  arrangeBy : ArrangeBy
  ): SimulationDimensions => {
    const factor = calcSizeReductionFactor(nrNodes, arrangeBy);
    return {
      nodeWidth : cellWidth * factor,
      nodeHeight : cellHeight * factor,
      nrNodes
    }
}