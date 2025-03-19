import * as d3 from 'd3';
import { remove, fadeIn } from '../../helpers/domHelpers';
import { COLOURS } from "../../constants";
import textWrapComponent from './textWrap';

const { BLUE, LIGHT_BLUE, GREY } = COLOURS;

export default function tooltip() {
    // settings that apply to all quadrantsBartcomponents, in case there is more than 1 eg a row of players
    let margin = { left:10, right:10, top: 0, bottom:10 };
    let width = 300;
    let height = 300;
    let contentsWidth;
    let contentsHeight;

    let titleHeight = 30;
    let subtitleHeight = 20;


    let styles = {
        bg:{
           stroke:"none",
           fill:"grey",
           rx:5,
           ry:5
        },
        title:{
            strokeWidth:0.3,
            stroke:"black",
            fontSize:"12px"
        },
        subtitle:{
            strokeWidth:0.15,
            stroke:"#505050",
            fontSize:"10px"
        },
        paragraphTitle:{
            strokeWidth:0.25,
            stroke:"black",
            fontSize:"11px"
        },
        textLine:{
            strokeWidth:0.15,
            stroke:"#505050",
            fontSize:"10px"
        }
    }


    function updateDimns(){
        contentsWidth = width - margin.left - margin.right;
        contentsHeight = height - margin.top - margin.bottom;
    };

    const textWrapComponents = [];

    function component(selection) {
        updateDimns();

        selection.each(function (data,i) {
            const componentEnter = d3.select(this).selectAll("*").empty();
            if(componentEnter){ init(this, data); }
            update(this, data, componentEnter);
        })

        function init(containerElement, data, settings={}){
            //'this' is the container
            const container = d3.select(containerElement)
                .attr('clip-path', "url(#tooltip-clip)")
            //here do anything for the component that isnt repeated for all quadrants
            //or just remove the init-update functions altogether
            //bg
            container.append("rect").attr("class", "component-bg")
                .attr("opacity", 0.85);

            d3.select('clipPath#tooltip-clip').select('rect')
                .attr('width', width)
                .attr("rx", styles.bg.rx)
                .attr("ry", styles.bg.ry)
                    .transition()
                    .duration(500)
                        .attr('height', height)

            const contentsG = container.append("g").attr("class", "component-contents");
            contentsG.append("rect").attr("class", "component-contents-bg")
                .attr("fill", "transparent");

            //component title and contents gs
            const componentTitleAndSubtitleG = contentsG.append("g").attr("class", "component-title-and-subtitle");
            contentsG.append("g").attr("class", "main-contents");

            //title
            componentTitleAndSubtitleG
                .append("text")
                    .attr("class", "title")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central");
                
            componentTitleAndSubtitleG
                .append("text")
                    .attr("class", "subtitle")
                    .attr("text-anchor", "middle");

            //title-hitbox
            componentTitleAndSubtitleG.append("rect").attr("class", "component-title-and-subtitle-hitbox")
                .attr("cursor", "pointer")
                .attr("fill", "transparent");

        }

        function update(containerElement, data, componentEnter, options={}){
            if(!componentEnter){
                d3.select('clipPath#tooltip-clip').select('rect')
                .attr('width', width)
                .attr('height', height)
            }
            //dimns
            const actualTitleHeight = data.title ? titleHeight : 0;
            const actualSubtitleHeight = data.subtitle ? subtitleHeight : 0;
            const mainContentsHeight = contentsHeight - actualTitleHeight - actualSubtitleHeight;
            //'this' is the container
            const container = d3.select(containerElement)
            //bg
            container.select("rect.component-bg")
                .attr("fill", styles.bg.fill)
                .attr("stroke", styles.bg.stroke)
                .attr("width", `${width}px`)
                .attr("height", `${height}px`)

            const contentsG = container.select("g.component-contents")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

            contentsG.select("rect.component-contents-bg")
                .attr("width", `${contentsWidth}px`)
                .attr("height", `${contentsHeight}px`);

            updateTitle.call(containerElement, data, { actualTitleHeight, actualSubtitleHeight });

            const mainContentsG = contentsG.select("g.main-contents")
                .attr("transform", `translate(0, ${actualTitleHeight + actualSubtitleHeight})`);

            //paragraphs
            //helper
            const nrParagraphs = data.paragraphs.length;
            const spaceBetweenParagraphs = 10;
            const nrSpaces = nrParagraphs - 1;
            const paragraphHeight = nrParagraphs === 0 ? 0 : (mainContentsHeight - nrSpaces * spaceBetweenParagraphs) / nrParagraphs;
            const paragraphG = mainContentsG.selectAll("g.paragraph").data(data.paragraphs)
            paragraphG.enter()
                .append("g")
                    .attr("class", "paragraph")
                    .each(function(d,i){ 
                        /*d3.select(this).append("text").attr("class", "paragraph-title")
                            .attr("stroke-width", styles.paragraphTitle.strokeWidth)
                            .attr("stroke", styles.paragraphTitle.stroke)
                            .attr("fill", styles.paragraphTitle.stroke)
                            .attr("font-size", styles.paragraphTitle.fontSize)*/

                        //create new Textbox
                        d3.select(this).append("g").attr("class", "textG");
                        if(!textWrapComponents[i]){
                            textWrapComponents[i] = textWrapComponent();
                        }
                    })
                    .merge(paragraphG)
                    .attr("transform", (paraD,i) => `translate(0, ${i * (paragraphHeight + spaceBetweenParagraphs)})`)
                    .each(function(paraD, i){
                        //title
                        /*d3.select(this).select("text.paragraph-title")
                            .text(paraD.title)*/

                        //update Textbox 
                        d3.select(this).select("g.textG")
                            .call(textWrapComponents[i]
                                .text(paraD.text), {
                                    width:contentsWidth, 
                                    //@todo - calc height based on letters/width or get from dom after render
                                    height:mainContentsHeight/2,
                                    fontMin:10,
                                    fontMax:10
                                });


                    })

            paragraphG.exit().call(remove)



        }

        return selection;
    }

    function updateTitle(data, options={}){
        const { actualTitleHeight, actualSubtitleHeight } = options;
        const titleG = d3.select(this).select("g.component-title-and-subtitle");
        titleG.select("text.title")
            .attr("transform", `translate(${contentsWidth/2}, ${actualTitleHeight/2})`)
            .attr("stroke-width", styles.title.strokeWidth)
            .attr("stroke", styles.title.stroke)
            .attr("fill", styles.title.stroke)
            .attr("font-size", styles.title.fontSize)
            .text(data.title || "");

        titleG.select("text.subtitle")
            .attr("transform", `translate(${contentsWidth/2}, ${actualTitleHeight + 5 + actualSubtitleHeight/2})`)
            .attr("stroke-width", styles.subtitle.strokeWidth)
            .attr("stroke", styles.subtitle.stroke)
            .attr("fill", styles.subtitle.stroke)
            .attr("font-size", styles.subtitle.fontSize)
            .text(data.subtitle || "");

        titleG.select("rect.component-title-and-subtitle-hitbox")
            .attr("width", contentsWidth)
            .attr("height", actualTitleHeight + actualSubtitleHeight)
    }


    //api
    component.width = function (value) {
        if (!arguments.length) { return width }
        width = value;
        return component;
    };
    component.height = function (value) {
        if (!arguments.length) { return height }
        height = value;
        return component;
    };
    component.margin = function (obj) {
        if (!arguments.length) { return margin }
        margin = { ...margin, ...value };
        return component;
    };
    component.styles = function (obj) {
        if (!arguments.length) { return styles; }
        styles = {
            ...obj,
            bg:{ ...styles.bg, ...obj.bg },
            title:{ ...styles.title, ...obj.title },
            subtitle:{ ...styles.subtitle, ...obj.subtitle },
            paragraphTitle:{ ...styles.paragraphTitle, ...obj.paragraphTitle },
            textLine:{ ...styles.textLine, ...obj.textLine },
        }
        return component;
    };
    return component;
};
