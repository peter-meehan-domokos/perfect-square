import * as d3 from 'd3';
import { LEVELS_OF_DETAIL, LEVELS_OF_DETAIL_THRESHOLDS, CHART_SIZE_REDUCTION_FACTOR_FOR_SIM, DEFAULT_CHART_MARGIN } from "./constants";

export const calcLevelOfDetailFromBase = baseSize => (k, disabledLevels=[]) => {
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

export const calcNrColsAndRows = (containerWidth, containerHeight, n) => {
    //aspect ratio, a
    const a = containerWidth / containerHeight;
    const proportionOfNForWidth = Math.sqrt(n * a);
    const nrCols = Math.round(proportionOfNForWidth);
    //always round up the rows so there is enough cells
    const nrRows = Math.ceil(n/nrCols);
    //@todo - consider adjusting cols if ther is an orphan on last row ie 
    //const nrOnLastRow = n - (nrRows-1) * nrCols;
    return { nrCols, nrRows }
  }

  export const isArranged = arrangeBy => arrangeBy?.x || arrangeBy?.y || arrangeBy?.colour ? true : false;

  const calcReductionFactor = arrangeBy => arrangeBy.x || arrangeBy.y || arrangeBy.colour ? CHART_SIZE_REDUCTION_FACTOR_FOR_SIM : 1;

  export const calcChartSizesAndGridLayout = (contentsWidth, contentsHeight, nrCols, nrRows, arrangeBy, _chartMargin={}) => {
    const reductionFactor = calcReductionFactor(arrangeBy);
    const chartWidth = reductionFactor * contentsWidth / nrCols;
    const chartHeight = reductionFactor * contentsHeight / nrRows;
    const chartMarginValues = typeof _chartMargin === "function" ? _chartMargin(chartWidth, chartHeight) : _chartMargin;
    const chartMargin = { ...DEFAULT_CHART_MARGIN, ...chartMarginValues }
    return { 
      chartWidth, chartHeight, chartMargin, 
      nrRows, nrCols
    }
  }

  export const applyMargin = (width, height, margin) => {
      return {
          contentsWidth : width - margin.left - margin.right,
          contentsHeight : height - margin.top - margin.bottom,
          margin
      }
  }

  export const isChartOnScreenCheckerFunc = (contentsWidth, contentsHeight, chartWidth, chartHeight, dataIsArranged) => (d, zoomTransform) => {
    const { x, y, k } = zoomTransform;
    const chartX1 = dataIsArranged ? d.x : d.gridX;
    const chartY1 = dataIsArranged ? d.y : d.gridY;
    const chartX2 = chartX1 + chartWidth;
    const chartY2 = chartY1 + chartHeight;

    const isOnScreenHorizontally = chartX2 * k + x >= 0 && chartX1 * k + x <= contentsWidth;
    const isOnScreenVertically = chartY2 * k + y >= 0 && chartY1 * k + y <= contentsHeight; 
    return isOnScreenHorizontally && isOnScreenVertically ? true : false;
  }

  export const calcZoomTransformFunc = (contentsWidth, contentsHeight, margin, chartWidth, chartHeight, dataIsArranged) => chartD => {
    const k = d3.min([contentsWidth/chartWidth, contentsHeight/chartHeight]);
    //Must remove impact of zoom on margin. This is needed because we want teh chart to have a margin, 
    //but when user zooms manually, we want it to disappear, which is more immersive (ie no artificial border)
    //therefore zoom is on the margin aswell, so we must discount it so it isnt enlarged
    const marginLeftAdjustment = margin.left - k * margin.left;
    const marginTopAdjustment = margin.top - k * margin.top

    //zoom into selected chart
    const xPos = dataIsArranged ? chartD.x : chartD.gridX;
    const yPos = dataIsArranged ? chartD.y : chartD.gridY;
    const x = -(xPos * k) + (contentsWidth - (k * chartWidth))/2 + marginLeftAdjustment;
    const y = -(yPos * k) + (contentsHeight - (k * chartHeight))/2 + marginTopAdjustment;

    return d3.zoomIdentity.translate(x, y).scale(k);

  }