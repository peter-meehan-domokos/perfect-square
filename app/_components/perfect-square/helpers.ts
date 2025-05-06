import { Container, Margin } from '@/app/common-types/data-types';
import * as d3 from 'd3';
import { LEVELS_OF_DETAIL, LEVELS_OF_DETAIL_THRESHOLDS, DEFAULT_CHART_MARGIN } from "./constants";

export const calcLevelOfDetailFromBase = (baseSize) => (k, disabledLevels=[]) => {
    const enabledLevels = LEVELS_OF_DETAIL.filter(l => !disabledLevels.includes(l));
    const nrLevels = enabledLevels.length;
    //@todo - add a level 4 threshold and shift them all up 1, with level 1 just a rect inside a rect
    if(baseSize * k > LEVELS_OF_DETAIL_THRESHOLDS[1]){ return enabledLevels[enabledLevels.length - 1]; }
    if(baseSize * k > LEVELS_OF_DETAIL_THRESHOLDS[0] && nrLevels > 1){ return enabledLevels[enabledLevels.length - 2];}
    return enabledLevels[0];
};

//returns levels that are inbetween both (note levels start at 1, not 0)
export const getDisabledLevelsForZoom = (initLevel, targLevel) =>
    initLevel && targLevel ? LEVELS_OF_DETAIL.slice(initLevel - 1, targLevel) : [];

export const applyMargin = (width : number, height : number, margin : Margin):Container => {
    return {
      width,
      height,
      //we can safely assert it as number because we know it wont be undefined because of the 0
      contentsWidth : d3.max([width - margin.left - margin.right, 0]) as number,
      contentsHeight : d3.max([height - margin.top - margin.bottom, 0]) as number,
      margin
    }
}
