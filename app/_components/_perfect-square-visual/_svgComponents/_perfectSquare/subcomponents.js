import * as d3 from 'd3';
import { remove, fadeIn } from '../../../../_helpers/domHelpers';
import { chartPathD, quadrantPathD, quadrantTransform } from './helpers';
import { FADE_IN_OUT_DURATION } from '@/app/constants';

/**
 * @description  
 *
 * @param {object} selection 
 * @param {object} width 
 * @param {object} height 
 * @param {object} settings
 * 
 * @returns {object} 
 */
export function header(selection, width, height, settings={}){
    const { summaryComponent, onClick=() => {}, styles, _scaleValue, _textColour, _quadrantSummaryTextColour=() => "none",
        shouldShowHeader, shouldShowSubtitle, shouldShowQuadrantsSummary } = settings;
        
    selection
        .each(function(data){
            const headerData = data.headerData || data;
            const headerG = d3.select(this).selectAll("g.chart-header").data(shouldShowHeader ? [headerData] : [])
            headerG.enter()
                .append("g")
                    .attr("class", "chart-header")
                    .each(function(d){
                        const headerG = d3.select(this);
                        headerG
                            .append("text")
                                .attr("class", "primary-title title")
                                    .attr("dominant-baseline", "hanging")
                                    .attr("opacity", 0);
                
                        headerG
                            .append("text")
                                .attr("class", "secondary-title title")
                                    .attr("opacity", 0);

                        headerG.append("rect")
                            .attr("class", "chart-header-hitbox")
                                .attr("cursor", "pointer")
                                .attr("fill", "transparent");

                    })
                    .merge(headerG)
                    .each(function(d){
                        const headerG = d3.select(this);
                        headerG.select("text.primary-title")
                            .transition()
                            .duration(FADE_IN_OUT_DURATION.FAST)
                                .attr("opacity", shouldShowHeader ? 0.45 : 0)
                                .attr("font-size", styles.primaryTitle?.fontSize)
                                .attr("stroke-width", _scaleValue(0.12))
                                .attr("stroke", _textColour(data.key))
                                .attr("fill", _textColour(data.key))
                                .text(d.title || "");

                        headerG.select("text.secondary-title")
                            .transition()
                            .duration(FADE_IN_OUT_DURATION.FAST)
                                .attr("opacity", shouldShowSubtitle ? 0.45 : 0)
                                .attr("transform", `translate(0, ${height * 0.8})`)
                                .attr("font-size", styles.secondaryTitle?.fontSize)
                                .attr("stroke-width", _scaleValue(0.08))
                                .attr("stroke", _textColour(data.key))
                                .attr("fill", _textColour(data.key))
                                .text(d.subtitle || "");

                        //summary box
                        const summaryWidth = width * 0.3;
                        const summaryHeight = height * 0.8;
                        const summaryContainerG = headerG.selectAll("g.header-summary-cont").data(shouldShowQuadrantsSummary ? [d] : []);
                        summaryContainerG.enter()
                            .append("g")
                                .attr("class", "header-summary-cont")
                                .call(fadeIn)
                                .merge(summaryContainerG)
                                .attr("transform", `translate(${width - summaryWidth},0)`)
                                .call(summaryComponent, summaryWidth, summaryHeight, { 
                                    _scaleValue, styles, _textColour:_quadrantSummaryTextColour
                                });

                        summaryContainerG.exit().call(remove);
                        
                        //hitbox
                        headerG.select("rect.chart-header-hitbox")
                            .attr("width", width)
                            .attr("height", height)
                            .on("click", onClick)

                    })

            headerG.exit().call(remove);           
        
    })
}

/**
 * @description  
 *
 * @param {object} selection  
 * @param {object} width 
 * @param {object} height
 * @param {object} settings
 *
 * @returns {object} 
 */
export function quadrantsSummary(selection, width, height, settings={}){
    const { _scaleValue, styles={}, _textColour=() => "black" } = settings;
    selection.each(function(data){
        const container = d3.select(this);
        const outlineG = container.selectAll("g.quadrants-summary-outline").data([1]);
        outlineG.enter()
            .append("g")
                .attr("class", "quadrants-summary-outline")
                .each(function(){
                    const outlineG = d3.select(this);
                    outlineG
                        .append("rect")
                            .attr("class", "summary-box summary-outline")
                            .attr("fill", "none");
            
                    outlineG.append("line").attr("class", "summary-vertical-line summary-outline");
                    outlineG.append("line").attr("class", "summary-horizontal-line summary-outline");

                    outlineG.selectAll(".summary-outline")
                        .attr("stroke", "grey");
                })
                .merge(outlineG)
                .each(function(){
                    const outlineG = d3.select(this);
                    outlineG.select("rect.summary-box")
                        .attr("width", width)
                        .attr("height", height);
                    
                    outlineG.select("line.summary-vertical-line")
                        .attr("x1", width/2)
                        .attr("x2", width/2)
                        .attr("y1", 0)
                        .attr("y2", height);

                    outlineG.select("line.summary-horizontal-line")
                        .attr("x1", 0)
                        .attr("x2", width)
                        .attr("y1", height/2)
                        .attr("y2", height/2);

                    outlineG.selectAll(".summary-outline")
                        .attr("stroke-width", _scaleValue(0.1));

                })

        const summaryG = container.selectAll("g.quadrant-summary").data(data.quadrantsData, q => q.key);
        summaryG.enter()
            .append("g")
                .attr("class", "quadrant-summary")
                .each(function(){
                    const summaryG = d3.select(this);
                    summaryG
                        .append("text")
                            .attr("text-anchor", "middle")
                            .attr("dominant-baseline", "central");
                })
                .merge(summaryG)
                .attr("transform", (d,i) => `translate(${i === 0 || i === 2 ? 0 : width/2},${i <= 1 ? 0 : height/2})`)
                .each(function(summaryD){
                    const summaryG = d3.select(this);
                    summaryG.select("text")
                        .attr("x", width/4)
                        .attr("y", height/4)
                        .attr("font-size", styles.summary?.fontSize)
                        .attr("stroke-width", _scaleValue(0.08))
                        .attr("stroke", _textColour(summaryD, data.key))
                        .attr("fill", _textColour(summaryD, data.key))
                        .text(`${summaryD.info.mean}%`);
                })

            summaryG.exit().call(remove); 
    })                
}

/**
 * @description  
 *
 * @param {object} selection 
 * @param {object} settings 
 * 
 * @returns {object} 
 */
export function quadrants(selection, quadrantWidth, quadrantHeight, quadrantTitleHeight, settings={}){
    const { styles, _scaleValue, _colour=() => "none", getBarsAreaStrokeWidth=() => 1,
        selectedQuadrantIndex, shouldShowSelectedQuadrantTitle,
        quadrantBarWidths, gapBetweenBars, _quadrantsContainerTransform=() => null, 
        shouldShowBars, shouldShowQuadrantOutlines, onClickBar
    } = settings;

    const barsAreaHeight = quadrantHeight - quadrantTitleHeight;
    selection.each(function(data){
        const container = d3.select(this);
        const quadrantsData = data.quadrantsData.filter(quadD => selectedQuadrantIndex === quadD.i || shouldShowQuadrantOutlines);
        const quadrantContainerG = container.selectAll("g.quadrant-container").data(quadrantsData, d => d.key)
        quadrantContainerG.enter()
            .append("g")
                .attr("class", (quadD,i) => `quadrant-container quandrant-container-${quadD.key}`)
                .each(function(quadD){
                    const quadrantContainerG = d3.select(this);
                    const quadrantG = quadrantContainerG.append("g").attr("class", "quadrant")
                    //selected-quadrant-title
                    quadrantG
                        .append("text")
                            .attr("class", "selected-quadrant-title")
                                .attr("text-anchor", "middle")
                                .attr("dominant-baseline", quadD.i < 2 ? null : "hanging")
                                .attr("stroke-width", 0.1)
                                .attr("opacity", 0)

                    const barsAreaG = quadrantG.append("g").attr("class", "bars-area");
                    barsAreaG
                        .append("rect")
                            .attr("class", "bars-area-bg")
                            .attr("fill", "transparent");
                     
                    barsAreaG.append("g").attr("class", "bars");
                })
                .merge(quadrantContainerG)
                .attr("transform", _quadrantsContainerTransform)
                .each(function(quadD){
                    //func passes parent key too, in case this function is called as part of a selectAll chain on parent types
                    const colour = _colour(quadD.i, data.key);
                    const isSelected = selectedQuadrantIndex === quadD.i ;
                    const quadrantContainerG = d3.select(this);

                    //make sure bar labels etc are on top of DOM
                    if(isSelected){ quadrantContainerG.raise(); }
                    //apply transform based on selectedQuadrantIndex
                    quadrantContainerG.call(quadrantTransform, quadrantWidth, quadrantHeight, selectedQuadrantIndex)

                    //quadrant-title
                    quadrantContainerG.select("text.selected-quadrant-title")
                        .attr("x", quadrantWidth/2)
                        .attr("y", quadD.i < 2 ? -5 : quadrantHeight + 5)
                        .attr("font-size", _scaleValue(styles.selectedTitle.fontSize))
                        .text(quadD.title)
                            .transition()
                            .duration(500)
                                .attr("opacity", shouldShowSelectedQuadrantTitle && isSelected ? 0.5 : 0)
                                    .on("end", function(){ d3.select(this).attr("display", shouldShowSelectedQuadrantTitle ? null : "none")})

                    //bars area bg
                    const barAreaShiftVert = quadD.i === 0 || quadD.i === 1 ? quadrantTitleHeight : 0;
                    const barsAreaG = quadrantContainerG.select("g.bars-area")
                        .attr("transform", `translate(0, ${barAreaShiftVert})`);

                    barsAreaG.select("rect.bars-area-bg")
                        .attr("width", quadrantWidth)
                        .attr("height", barsAreaHeight);

                    barsAreaG.select("rect.bars-area-bg")
                        .transition()
                        .duration(500)
                            .attr("stroke", colour) 
                            .attr("stroke-width", getBarsAreaStrokeWidth(quadD.i))

                    //bars and quadrant outline paths
                    const barsDirection = quadD.i < 2 ? "up" : "down";
                    barsAreaG
                        .datum(quadD)
                        //width, barsAreaHeight, barWidth, gapBetweenBars
                        .call(bars, barsAreaHeight, quadrantBarWidths[quadD.i], gapBetweenBars,{
                            shouldShowBars, barsDirection, styles:styles.bar, colour, onClick:onClickBar
                        })
                        .call(quadrantOutlinePath, barsAreaHeight, quadrantBarWidths[quadD.i], gapBetweenBars, {
                            shouldShowQuadrantPaths:!shouldShowBars, styles:styles.outlinePath, colour
                        });
                })
        
        quadrantContainerG.exit().call(remove);

    })
}

/**
 * @description  
 *
 * @param {object} selection 
 * @param {object} settings 
 * 
 * @returns {object} 
 */
function bars(selection, barsAreaHeight, barWidth, gapBetweenBars, settings={}){
    const { styles, shouldShowBars, barsDirection="up", colour, onClick=() => {} } = settings;
    selection.each(function(data){
        const container = d3.select(this);
        //bars
        const barsData = shouldShowBars ? data.values : [];

        const barG = container.selectAll("g.bar").data(barsData, d => d.key);
        barG.enter()
            .append("g")
                .attr("class", `bar`)
                .attr("cursor", "pointer")
                .each(function(barD){
                    const barHeight = barD.calcBarHeight(barsAreaHeight);
                    const barG = d3.select(this);
                    barG
                        .append("rect")
                            .attr("class", "bar")
                                .attr("width", barWidth)
                                .attr("height", barHeight);
                })
                .merge(barG)
                .each(function(barD, barIndex){
                    const barG = d3.select(this)
                        .on("click", e => {
                            onClick(e,barD)
                        });
                    //update content and fill
                    const barHeight = barD.calcBarHeight(barsAreaHeight);
                    //no space between bars and outer edge of chart
                    barG
                        .attr("transform", `translate(${barIndex * (barWidth + gapBetweenBars)},${barsDirection === "up" ? barsAreaHeight - barHeight : 0})`)

                    barG.select("rect.bar")
                        .transition()
                        .duration(100)
                            .attr("width", barWidth)
                            .attr("height", barHeight)
                            .attr("fill", colour)
                })

        barG.exit().remove()//call(remove);
    })
}

/**
 * @description  
 *
 * @param {object} selection 
 * @param {object} settings 
 * 
 * @returns {object} 
 */
export function quadrantOutlinePath(selection, barsAreaHeight, barWidth, gapBetweenBars, settings={}){
    //console.log("quadOutlinePath", selection.data()[0].key, selection.data())
    const { styles, shouldShowQuadrantPaths, colour } = settings;
    selection.each(function(quadD){
        const container = d3.select(this);
        //const isEmpty = container.selectAll("g.quadrant-outline").empty();
        //if(!isEmpty){ console.log("not empty")}
        //outline paths
        const outlineData = shouldShowQuadrantPaths ? [quadD.values] : [];
        const outlineG = container.selectAll("g.quadrant-outline").data(outlineData)
        outlineG.enter()
            .append("g")
                .attr("class", "quadrant-outline")
                .each(function(values){
                    //console.log("enter")
                    d3.select(this).append("path")
                        .attr("class", "quadrant-outline")
                })
                .merge(outlineG)
                .each(function(values) {
                    //update content and fill
                    d3.select(this).select("path")
                        .attr("fill", colour)
                        //need this here if sizes change eg sim turned on
                        .attr("d", quadrantPathD(values, quadD.i, barsAreaHeight, barWidth, gapBetweenBars))
                })

        outlineG.exit().remove()//call(remove);
    })

}

/**
 * @description  
 *
 * @param {object} selection 
 * @param {object} settings 
 * 
 * @returns {object} 
 */
export function chartOutlinePath(selection, quadrantBarWidths, barsAreaHeight, gapBetweenBars, settings={}){
    const { colour, onClick=() => {}, shouldShowChartOutline } = settings;

    //console.log("chartOutlinePath", selection.data()[0].key, selection.data())
    selection.each(function(data, i){
        const container = d3.select(this);
        //const isEmpty = container.select("path.chart-outline").empty();
        //if(!isEmpty){ console.log("not empty")}

        const chartOutlineData = shouldShowChartOutline ? [data] : [];
        //console.log("i datakey outlineData", i, data.key, chartOutlineData)
        //error - when level changes from 2 to 1, sometimes there are about 6 ds that 
        //run this function but dont enter a path even though when you lok at teh dom, 
        //its not entered, snd it shouldnt be because it only just went to level 1 on this run!
        const outlinePath = container.selectAll("path.chart-outline").data(chartOutlineData, d => d.key);
        outlinePath.enter()
            .append("path")
                .attr("class", "chart-outline")
                .each(function(){
                    //console.log("entered")
                })
                .attr("cursor", "pointer")
                .on("click", onClick)
                .merge(outlinePath)
                //need this if sizes change eg sim turned on
                .attr("d", chartPathD(data, quadrantBarWidths, barsAreaHeight, gapBetweenBars))
                .attr("fill", colour)

        outlinePath.exit().remove()//call(remove);

    })
}
