import { Container, ContainerWithDatapointPositioning, Margin, PositionedDatapoint } from '@/app/common-types/data-types';
import { ZoomCallbacks } from '@/app/common-types/function-types';
import { ZoomTransform, ZoomBehavior, ZoomedElementBaseType } from "d3-zoom";
import * as d3 from 'd3';

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
   export const isChartOnScreenCheckerFunc = (
    container : Container, 
    chart : ContainerWithDatapointPositioning, 
    zoomTransform : ZoomTransform
  ) => (chartD : PositionedDatapoint) => {
    const { contentsWidth, contentsHeight } = container;
    
    const { x, y, k } = zoomTransform;
    const chartX1 = chart._x(chartD);
    const chartY1 = chart._y(chartD);
    const chartX2 = chartX1 + chart.width;
    const chartY2 = chartY1 + chart.height;

    const BUFFER = 200; 

    const isOnScreenHorizontally = chartX2 * k + x >= 0 - BUFFER && chartX1 * k + x <= contentsWidth + BUFFER;
    const isOnScreenVertically = chartY2 * k + y >= 0 - BUFFER && chartY1 * k + y <= contentsHeight + BUFFER; 
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
  export const calcZoomTransformFunc = (
    container : Container, 
    chart : ContainerWithDatapointPositioning
    ) => (
      chartD : PositionedDatapoint
      ) => {
        //@todo  - change type of chart.width and height to nonzero numbers
        if(chart.width === 0 || chart.height === 0){ return undefined; }
        const { contentsWidth, contentsHeight } = container;
        //can safely assert k is not undefined, because all 4 numbers involved are defined, and the denominators non-zero
        const k = d3.min([contentsWidth/chart.width, contentsHeight/chart.height])!;
        const chartX = chart._x(chartD);
        const chartY = chart._y(chartD);
        
        //zoom into selected chart
        const translateX = -(chartX * k) + (contentsWidth - (k * chart.width))/2;
        const translateY = -(chartY * k) + (contentsHeight - (k * chart.height))/2;

        return d3.zoomIdentity.translate(translateX, translateY).scale(k);

  }

  /**
 * @description Calculates and applies basic settings to the zoom, and attaches event handlers 
 *
 * @param {D3ZoomBehaviourObject} zoom the d3 zoom behaviour object, initialised by d3.zoom()
 * @param {Number} contentsWidth the width of the zoom space
 * @param {Number} contentsHeight the height of zoom space
 * @param {Number} chartWidth the width of each individual chart
 * @param {Number} chartHeight the height of each individual chart
 * @param {object} options the optional event handlers to be attached
 * 
 */
export function setupZoom(
  zoom : ZoomBehavior<ZoomedElementBaseType, PositionedDatapoint>, 
  container : Container, 
  chartContainer : Container, 
  callbacks :ZoomCallbacks = {}
  ):void {
      //check denominator is non-zero
      if(chartContainer.width === 0 || chartContainer.height === 0){ return; }

      const { onStart = () => {}, onZoom = () => {}, onEnd = () => {} } = callbacks;
      const { contentsWidth, contentsHeight } = container;

      //we allow user to zoom into margin, as more immersive (ie no artifical boundary)
      //can assert as we have checked non-zero denominators and know we have all 4 numbers
      const kMax = d3.max([contentsWidth/chartContainer.width, contentsHeight/chartContainer.height])!;
      zoom
        .scaleExtent([1, kMax])
        //@todo - make this contentsWidth and height, and shoft zoomG too by the margin
        .translateExtent([[0, 0], [contentsWidth, contentsHeight]])
        .on("start", onStart)
        .on("zoom", onZoom)
        .on("end", onEnd);
}


  