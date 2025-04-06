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


  export const isArranged = arrangeBy => arrangeBy?.x || arrangeBy?.y || arrangeBy?.colour ? true : false;

  const calcReductionFactor = (nrDatapoints, arrangeBy) => {
    const dataIsArranged = isArranged(arrangeBy);
    //@todo - apply a log scale instead so continually increases but never reaches limit
    const extraReductionForDatapoints = d3.min([0.1, 0.002 * nrDatapoints]);
    const nrDatapointsFactor = 1 - extraReductionForDatapoints;

    //if data is arranged but with no x an dy, it will form a group around centre, so need more space
    const extraReductionIfCentred = arrangeBy.colour && !arrangeBy.x && !arrangeBy.y ? 0.15 : 0;
    const centredFactor = 1 - extraReductionIfCentred;
    return dataIsArranged ? nrDatapointsFactor * centredFactor * CHART_SIZE_REDUCTION_FACTOR_FOR_SIM : 1;
  }

  export const calcChartSizesAndGridLayout = (contentsWidth, contentsHeight, nrCols, nrRows, nrDatapoints, arrangeBy, _chartMargin={}) => {
    const reductionFactor = calcReductionFactor(nrDatapoints, arrangeBy);
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
        width,
        height,
          contentsWidth : width - margin.left - margin.right,
          contentsHeight : height - margin.top - margin.bottom,
          margin
      }
  }

  /**
 * @description A higher-order function that returns a function that determines whether or not the chart of a particular
 * datapoint is on screen, given the current zoom state. This will typically be called in two parts. 
 * Initally it will be passed the first 5 parameters, to set up the checker,
 * and then the returned function can be called on each datapoint.
 *
 * @param {Number} contentsWidth The width of the overall container of the svg visual, minus the margins
 * @param {Number} contentsHeight The height of the overall container of the svg visual, minus the margins
 * @param {Number} chartWidth The width of each individual chart (ie for each datapoint)
 * @param {Number} chartHeight The height of each individual chart (ie for each datapoint)
 * @param {boolean} dataIsArranged A flag that shows whether or not the force is being used. If not, it is a grid layout.
 * 
 * @return {function} returns the function described below
 * 
 * Documentation of the returned function
 * 
 * @description A function which calculates whether or not the chart of a given datapoint is currently on screen, given the zoom state
 * This function has access to the above params too, via scoping
 * 
 * @param {object} d The datum (ie processed datapoint) of the particular chart being checked
 * @param {D3ZoomTransformObject} zoomTranform an object that includes x,y, and k(scale) properties describing the current zoom state
 * 
 * @returns {boolean} true iff this chart is currently positioned within the viewbox of the container, given the current zoom state.
 */
  export const isChartOnScreenCheckerFunc = (contentsWidth, contentsHeight, chartWidth, chartHeight, _chartX = d=>d.x, _chartY = d=>d.y) => (chartD, zoomTransform) => {
    const { x, y, k } = zoomTransform;
    const chartX1 = _chartX(chartD);
    const chartY1 = _chartY(chartD);
    const chartX2 = chartX1 + chartWidth;
    const chartY2 = chartY1 + chartHeight;

    const isOnScreenHorizontally = chartX2 * k + x >= 0 && chartX1 * k + x <= contentsWidth;
    const isOnScreenVertically = chartY2 * k + y >= 0 && chartY1 * k + y <= contentsHeight; 
    return isOnScreenHorizontally && isOnScreenVertically ? true : false;
  }


  /**
 * @description A higher-order function that returns a function that calculates the required zoom state to zoom in to
 * a selected chart/datapoint. 
 * 
 * (Note that the zoom is applied to the outer container, which is a design decision because
 * it leads to a more immersive experience, as there are no artificial boundaries whilst the user zooms. It does mean
 * that we must exclude the margin from the zooming calculation here, so the margin doesnt also enlarge)
 *
 * @param {Number} contentsWidth The width of the overall container of the svg visual, minus the margins
 * @param {Number} contentsHeight The height of the overall container of the svg visual, minus the margins
 * @param {Number} margin The margin of the container (needed so we can exclude it from zooming)
 * @param {Number} chartWidth The width of each individual chart (ie for each datapoint)
 * @param {Number} chartWidth The width of each individual chart (ie for each datapoint)
 * @param {Number} chartHeight The height of each individual chart (ie for each datapoint)
 * 
 * @return {function} returns the function described below
 * 
 * Documentation of the returned function
 * 
 * @description A function which calculates the required zoom state to zoom in to a selected chart/datapoint. 
 * @param {object} selectedChartD The datum (ie processed datapoint) of the selected chart
 * 
 * @returns {D3ZoomTransformObject} The D3 Transform that is ready to be applied to the zoom g in the dom.
 * It contains the required x, y and k(scale) values to zoom into the selected chart
 */
  export const calcZoomTransformFunc = (contentsWidth, contentsHeight, margin, chartWidth, chartHeight, _chartX=d=>d.x, _chartY=d=>d.y) => chartD => {
    const k = d3.min([contentsWidth/chartWidth, contentsHeight/chartHeight]);
    //Remove impact of zoom on margin to keep it constant
    const marginLeftAdjustment = margin.left - k * margin.left;
    const marginTopAdjustment = margin.top - k * margin.top

    const chartX = _chartX(chartD);
    const chartY = _chartY(chartD);
    //zoom into selected chart
    const translateX = -(chartX * k) + (contentsWidth - (k * chartWidth))/2 + marginLeftAdjustment;
    const translateY = -(chartY * k) + (contentsHeight - (k * chartHeight))/2 + marginTopAdjustment;

    return d3.zoomIdentity.translate(translateX, translateY).scale(k);

  }