import * as d3 from 'd3';
import { header, quadrantsSummary, quadrants, chartOutlinePath } from './subComponents';
import { quadrantsContainerTransform } from './d3DomHelpers';
import { isNumber } from '../../helpers/dataHelpers';
import { remove, fadeIn } from '../../helpers/domHelpers';
import { calcLevelOfDetailFromBase, getDisabledLevelsForZoom } from './helpers';
import { COLOURS } from "../../constants";
import { DEFAULT_SETTINGS, APPEAR_TRANSITION_DURATION } from './constants';

const { BLUE, LIGHT_BLUE, GREY, DARK_GREY } = COLOURS;

export default function perfectSquare() {
    // settings that apply to all charts
    // Some settings need values as can be called before updateDimnsAndColourAccessors() function sets them
    let margin = { left:0, right:0, top: 0, bottom:0 };
    let width = 800;
    let height = 600;
    let contentsWidth;
    let contentsHeight;

    let headerWidth;
    let headerHeight;
    let chartAreaWidth;
    let chartAreaHeight;

    let gapBetweenQuadrants;
    let zoomedGapBetweenQuadrants;
    let quadrantWidth;
    let quadrantHeight;
    let quadrantTitleHeight;
    let barsAreaHeight;
    let extraHorizMargin;
    let extraVertMargin;

    let gapBetweenBars;
    let quadrantBarWidths = [];

    let styles = {
        header:{
            primaryTitle:{
                fontSize:24
            },
            secondaryTitle:{
                fontSize:14
            },
            summary:{
                fontSize:10
            }
        },
        quadrant:{
            title:{
                fontSize:12
            },
            selectedTitle:{
                fontSize:12
            }
        },
        bar:{
            fontSize:10
        },
        outlinePath:{
            strokeWidth:0.3
        }
    }

    //settings
    //semantic zoom-related (level of detail)
    let baseSize = width;
    let calcLevelOfDetail = calcLevelOfDetailFromBase(baseSize);
    let zoomingInProgress = null;
    let zoomK = 1;
    let arrangeBy = DEFAULT_SETTINGS.arrangeBy;
    //let withBarLabels;
    let levelOfDetail;
    let prevLevelOfDetail;

    let nrCharts;

    //@todo - move these funcitons into a map in constants file instead
    const _shouldShowHeader = levelOfDetail => levelOfDetail >= 2;
    const _shouldShowQuadrantOutlines = levelOfDetail => levelOfDetail >= 2;
    const _shouldShowSubtitle = levelOfDetail => levelOfDetail >= 3;
    const _shouldShowBars = levelOfDetail => levelOfDetail >= 3;
    const _barsAreClickable = levelOfDetail => levelOfDetail >= 3;
    const _shouldShowQuadrantsSummary = levelOfDetail => levelOfDetail >= 3;
    const _shouldShowSelectedQuadrantTitle = levelOfDetail => levelOfDetail >= 3;

    //level of detail related flags
    let shouldShowHeader;
    let shouldShowSubtitle;
    let shouldShowQuadrantsSummary;
    let shouldShowSelectedQuadrantTitle;
    let shouldShowBars;
    let shouldShowQuadrantOutlines;
    let shouldShowChartOutline;
    let barsAreClickable;
 
    function updateDimnsAndColourAccessors(selection){
        updateDimns(selection);
        updateColourAccessors();
    };

    function updateDimns(selection){
        _scaleValue = value => value / zoomK;

        const maxContentsWidth = width - margin.left - margin.right;
        const maxContentsHeight = height - margin.top - margin.bottom;

        quadrantTitleHeight = 0;
        //withBarLabels = true;
        //level of detail 
        prevLevelOfDetail = levelOfDetail;
        baseSize = d3.min([maxContentsWidth, maxContentsHeight]);
        const disabledLevels = getDisabledLevelsForZoom(zoomingInProgress?.initLevelOfDetail, zoomingInProgress?.targLevelOfDetail);
        //store calculation funciton so can use it elsewhere dynamically
        calcLevelOfDetail = calcLevelOfDetailFromBase(baseSize, disabledLevels);
        levelOfDetail = calcLevelOfDetail(zoomK);

        //level of detail related flags
        shouldShowHeader =  _shouldShowHeader(levelOfDetail);
        shouldShowSubtitle =  _shouldShowSubtitle(levelOfDetail);
        shouldShowQuadrantsSummary = _shouldShowQuadrantsSummary(levelOfDetail);
        shouldShowSelectedQuadrantTitle = _shouldShowSelectedQuadrantTitle(levelOfDetail, selectedQuadrantIndex);
        shouldShowBars = _shouldShowBars(levelOfDetail);
        shouldShowQuadrantOutlines = _shouldShowQuadrantOutlines(levelOfDetail);
        shouldShowChartOutline = !shouldShowQuadrantOutlines && !isNumber(selectedQuadrantIndex);
        barsAreClickable  = _barsAreClickable(levelOfDetail);

        headerHeight = shouldShowHeader ? (maxContentsHeight * (shouldShowSubtitle ? 0.18 : 0.15)) : 0;

        //contentsheight includes space for quad titles, whereas contenstWidth doesnt
        contentsWidth = d3.min([maxContentsWidth, maxContentsHeight - headerHeight - 2 * quadrantTitleHeight]);
        contentsHeight = contentsWidth + headerHeight + 2 * quadrantTitleHeight;

        gapBetweenQuadrants = d3.min([10, contentsWidth * 0.005]);
        //gap must not be as large as the axeswidth
        gapBetweenBars = gapBetweenQuadrants * 0.1;
        //keep the gap between quadrants under some control
        const maxGapBetweenQuadrants = gapBetweenQuadrants * 5;
        //note - the zoomed gap is the one displayed, but it doesnt affect any other calculations, so it can adjust with zoom
        //and not affect performance
        //next - make this 0 when lost of charts on screen ir when width very small, and scale it up nicely
        zoomedGapBetweenQuadrants = /*levelOfDetail === 1 ? 0 :*/ d3.min([maxGapBetweenQuadrants, gapBetweenQuadrants * zoomK ** 0.7]);

        const extraHorizSpace = maxContentsWidth - contentsWidth;
        const extraVertSpace = maxContentsHeight - contentsHeight;
        extraHorizMargin = extraHorizSpace/2;
        extraVertMargin = extraVertSpace/2;

        headerWidth = contentsWidth;

        chartAreaWidth = contentsWidth;
        chartAreaHeight = contentsHeight - headerHeight;

        quadrantWidth = (chartAreaWidth - gapBetweenQuadrants - zoomedGapBetweenQuadrants)/2;
        //quadrant title is part of the quadrant, whereas chart title is not, so we subtract it
        quadrantHeight = (chartAreaHeight - gapBetweenQuadrants - zoomedGapBetweenQuadrants)/2;
        //Each bar area works out as a square because of the way dimns are done above
        //barsAreaWidth = quadrantWidth;
        //barsAreaHeight = quadrantHeight - quadrantTitleHeight;
        barsAreaHeight = quadrantHeight - quadrantTitleHeight;

        //bar widths for each quadrant
        selection
            .filter((d,i) => i === 0)
            .each(function(chartData){
                const { quadrantsData } = chartData;
                quadrantsData.forEach(quadD => {
                    const nrBars = quadD.values.length;
                    const nrGaps = nrBars - 1;
                    const totalSpaceForBars = quadrantWidth - gapBetweenBars * nrGaps;
                    quadrantBarWidths[quadD.i] = totalSpaceForBars/nrBars;
                })
            })

        styles.header.primaryTitle.fontSize = shouldShowSubtitle ? headerHeight * 0.32 : headerHeight * 0.7;
        styles.header.secondaryTitle.fontSize = headerHeight * 0.2;
        styles.header.summary.fontSize = headerHeight * 0.15;
    }

    function updateColourAccessors(){
        _chartColourWhenNotGreyedOut = d => {
            const summaryMeasureKey = arrangeBy.colour; //value, deviation or position
            if(!summaryMeasureKey || !metaData.data) { return BLUE; }
            const { min, max, range } = metaData.data.info[summaryMeasureKey] 
            const value = d.info[summaryMeasureKey];
            const valueAsProportion = (value - min)/range;
            return colourScale(scaleStartPoint + valueAsProportion * (scaleEndPoint - scaleStartPoint))
        }
        _chartColour = d => {
            const anotherChartIsSelected = selectedChartKey && selectedChartKey !== d.key ? true : false;
            if(anotherChartIsSelected){ return GREY; }
            return _chartColourWhenNotGreyedOut(d);
        };

        _quadrantColour = (quadD, chartD) => {
            //Case 1. quadrant selected overrides other determinants
            if(quadD.i === selectedQuadrantIndex){ return _chartColourWhenNotGreyedOut(chartD); }
            //quadrant isnt selcted, so depends on other issues
            //Case 2. other quadrant selected greys it out
            const anotherQuadrantIsSelected = isNumber(selectedQuadrantIndex) && selectedQuadrantIndex !== quadDIndex;
            if(anotherQuadrantIsSelected){ return GREY; }
            //Case 3. default to chart
            return _chartColour(chartD);
        }

        _headerTextColour = chartKey => {
            const anotherChartIsSelected = selectedChartKey && selectedChartKey !== chartKey ? true : false;
            return anotherChartIsSelected ? GREY : DARK_GREY;
        }

        _quadrantSummaryTextColour = (summaryD, chartKey) => {
            //Case 1. greyed out
            const anotherChartIsSelected = selectedChartKey && selectedChartKey !== chartKey ? true : false;
            const anotherQuadrantIsSelected = isNumber(selectedQuadrantIndex) && selectedQuadrantIndex !== summaryD.i;
            if(anotherChartIsSelected || anotherQuadrantIsSelected){ return GREY; }
            //Case 2. highlighhted in red
            if(summaryD.info.mean < 50){ return "red";}
            //Case 3. return a standard easy to read blue
            return BLUE;
        }

    }

    //state
    let metaData = {};
    let selectedQuadrantIndex = null;
    let selectedChartKey = "";
    let selectedMeasureKey = "";
    //handlers
    let setSelectedChartKey = () => {};
    let setSelectedMeasureKey = () => {};

    //helper
    let _scaleValue;
    const colourScale = d3.scaleSequential(d3.interpolateBlues); //takes values 0 to 1
    const scaleStartPoint = 0.5;
    const scaleEndPoint = 1;
    let _chartColourWhenNotGreyedOut;
    let _chartColour;
    let _quadrantColour;
    let _headerTextColour;
    let _quadrantSummaryTextColour;

    function chart(selection, options={}) {
        //const levelChanged = levelOfDetail !== prevLevelOfDetail;
        //if(levelChanged){ console.log("LEVEL CHANGED!!!!")}
        nrCharts = selection.nodes().length;
        if(nrCharts === 0){ return; }
        updateDimnsAndColourAccessors(selection);
        //console.log("UPDATE: nrCharts, LOD", nrCharts, levelOfDetail)

        selection
            .filter(d => d.isOnScreen)
            .call(init, options)
            .call(update, options);

        function init(selection, options={}){
            selection.each(function(){
                const container = d3.select(this);
                if(!container.selectAll("*").empty()){ return; }

                //bg
                container.append("rect").attr("class", "component-bg")
                    .attr("fill", "transparent");

                const contentsG = container.append("g").attr("class", "component-contents");
                contentsG.append("rect").attr("class", "component-contents-bg")
                    .attr("fill", "transparent");

                //chart area is all the space under the header
                const chartAreaG = contentsG.append("g").attr("class", "chart-area");
                chartAreaG.append("rect").attr("class", "chart-area-bg")
                    .attr("fill", "transparent");

                //g that handles scaling when selections made
                chartAreaG.append("g").attr("class", "quadrants-container")
                    .attr("transform", "scale(1)");

                //chart-hitbox
                chartAreaG.append("rect").attr("class", "chart-hitbox")
                    .attr("cursor", "pointer")
                    .attr("fill", "transparent");

            })
        }

        //called for updates to data, core sizes, selectedQuadrantIndex
        function update(options={}){
            selection.each(function(chartData){
                const container = d3.select(this);
                //flags & values
                const anotherChartIsSelected = selectedChartKey && selectedChartKey !== chartData.key ? true : false;
                const chartColour = _chartColour(chartData);
                const anotherQuadrantIsSelectedChecker = quadIndex => isNumber(selectedQuadrantIndex) && selectedQuadrantIndex !== quadIndex;

                //bg
                container.select("rect.component-bg")
                    .attr("width", `${width}px`)
                    .attr("height", `${height}px`);
                    //.attr("stroke", "black")
                    //.attr("stroke-width", 0.05);

                const contentsG = container.select("g.component-contents")
                    .attr("transform", `translate(${margin.left + extraHorizMargin}, ${margin.top + extraVertMargin})`);

                contentsG.select("rect.component-contents-bg")
                    .attr("width", `${contentsWidth}px`)
                    .attr("height", `${contentsHeight}px`)

                //header
                contentsG.call(header, headerWidth, headerHeight, 
                    { 
                        onClick:() => setSelectedChartKey(chartData.key),
                        summaryComponent:quadrantsSummary, 
                        styles:styles.header,
                        _scaleValue,
                        shouldShowHeader,
                        shouldShowSubtitle,
                        shouldShowQuadrantsSummary,
                        _textColour:_headerTextColour,
                        _quadrantSummaryTextColour
                    });


                const chartAreaG = contentsG.select("g.chart-area")
                    .attr("transform", `translate(0, ${headerHeight})`);

                chartAreaG.select("rect.chart-area-bg")
                    .attr("width", `${chartAreaWidth}px`)
                    .attr("height", `${chartAreaHeight}px`)
                    //we use chart-area-bg as the default border when no quadrants are showing (ie when its the chart path showing)
                    .attr("stroke", shouldShowQuadrantOutlines || isNumber(selectedQuadrantIndex)  ? "none" : chartColour)
                    .attr("stroke-width", _scaleValue(0.2));

                //hitbox (title is always clickable, but chart itself is only clickable when bars are not)
                chartAreaG.select("rect.chart-hitbox")
                    .attr("width", chartAreaWidth)
                    .attr("height", chartAreaHeight)
                    .attr("cursor", "pointer")
                    .attr("display", barsAreClickable ? "none" : null)
                    .on("click", () => setSelectedChartKey(chartData.key))
                    
                chartAreaG.select("g.quadrants-container")
                    .call(quadrantsContainerTransform, chartAreaWidth, chartAreaHeight, selectedQuadrantIndex)
                    .call(quadrants, quadrantWidth, quadrantHeight, quadrantTitleHeight, {
                        _quadrantsContainerTransform:quadD => `translate(
                            ${(quadD.i === 0 || quadD.i === 2) ? 0 : quadrantWidth + gapBetweenQuadrants + zoomedGapBetweenQuadrants}, 
                            ${(quadD.i === 0 || quadD.i === 1) ? 0 : quadrantHeight + gapBetweenQuadrants + zoomedGapBetweenQuadrants})`,
                        styles:styles.quadrant,
                        _scaleValue,
                        quadrantBarWidths,
                        gapBetweenBars,
                        selectedChartKey,
                        selectedQuadrantIndex,
                        shouldShowSelectedQuadrantTitle,
                        shouldShowBars,
                        shouldShowQuadrantOutlines,
                        _chartColour,
                        _colour:quadIndex => anotherQuadrantIsSelectedChecker(quadIndex) || anotherChartIsSelected ? GREY : chartColour,
                        getBarsAreaStrokeWidth:quadIndex => _scaleValue(anotherQuadrantIsSelectedChecker(quadIndex) || anotherChartIsSelected ? 0.1 : 0.3),
                        onClickBar:(e, barD) => setSelectedMeasureKey(barD.measureKey)
                    });

                //chart outline
                chartAreaG.call(chartOutlinePath, quadrantBarWidths, barsAreaHeight, gapBetweenBars, {
                    shouldShowChartOutline,
                    colour: anotherChartIsSelected ? GREY : chartColour,
                    onClick:() => setSelectedChartKey(chartData.key)
                })
            })
        }

        return selection;
    }

    //api
    chart.width = function (value) {
        if (!arguments.length) { return width }
        width = value;
        return chart;
    };
    chart.height = function (value) {
        if (!arguments.length) { return height }
        height = value;
        return chart;
    };
    chart.margin = function (value) {
        if (!arguments.length) { return margin }
        margin = { ...margin, ...value };
        return chart;
    };
    chart.metaData = function (value) {
        if (!arguments.length) { return metaData; }
        metaData = value;
        return chart;
    };
    chart.selectedQuadrantIndex = function (value) {
        if (!arguments.length) { return selectedQuadrantIndex; }
        selectedQuadrantIndex = value;
        return chart;
    };
    chart.selectedChartKey = function (value) {
        if (!arguments.length) { return selectedChartKey; }
        selectedChartKey = value;
        return chart;
    };
    chart.selectedMeasureKey = function (value) {
        if (!arguments.length) { return selectedMeasureKey; }
        selectedMeasureKey = value;
        return chart;
    };
    chart.zoomK = function (value) {
        if (!arguments.length) { return zoomK; }
        zoomK = value;
        return chart;
    };
    chart.zoomingInProgress = function (value) {
        if (!arguments.length) { return zoomingInProgress; }
        zoomingInProgress = { 
            ...value, initLevelOfDetail:levelOfDetail, targLevelOfDetail:calcLevelOfDetail(value.targK) 
        }
        return chart;
    };
    chart.arrangeBy = function (value) {
        if (!arguments.length) { return arrangeBy; }
        arrangeBy = value;
        return chart;
    };
    chart.setSelectedChartKey = function (func) {
        if (!arguments.length) { return setSelectedChartKey; }
        setSelectedChartKey = func;
        return chart;
    };
    chart.setSelectedMeasureKey = function (func) {
        if (!arguments.length) { return setSelectedMeasureKey; }
        setSelectedMeasureKey = func;
        return chart;
    };
    return chart;
};
