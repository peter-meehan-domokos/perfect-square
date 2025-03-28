import * as d3 from 'd3';
import { remove, fadeIn } from '../../helpers/domHelpers';
import { COLOURS } from "../../constants";
import textWrapComponent from './textWrap';

const { BLUE, LIGHT_BLUE, GREY } = COLOURS;

const TOOLTIP_OPACITY = 0.85;

export default function tooltip() {
    // settings that apply to all quadrantsBartcomponents, in case there is more than 1 eg a row of players
    let margin = { left:10, right:10, top: 10, bottom:10 };
    let fixedWidth = 300;
    let fixedHeight = 300;
    let fixedContentsWidth;
    let fixedContentsHeight;
    //dimns can be set to be dynamic functions (_ convention)
    let _width;
    let _height;
    let _contentsWidth;
    let _contentsHeight;

    let titleHeight = 30;
    let subtitleHeight = 20;


    let _styles;
    let fixedStyles = {
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
            fontMin:10,
            fontMax:10
        }
    }


    function updateDimns(){
        if(_width){
            _contentsWidth = d => _width(d) - margin.left - margin.right;
        }else{
            fixedContentsWidth = fixedWidth - margin.left - margin.right;
        }
        if(_height){
            _contentsHeight = d => _height(d) - margin.top - margin.bottom;
        }else{
            fixedContentsHeight = fixedHeight - margin.top - margin.bottom;
        }
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
            const width = _width ? _width(data) : fixedWidth;
            const height = _height ? _height(data) : fixedHeight;

            //'this' is the container
            const container = d3.select(containerElement);
            //bg
            container.append("rect").attr("class", "component-bg")
                .attr("opacity", TOOLTIP_OPACITY)
                .attr("rx", 5)
                .attr("ry", 5);

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
            const width = _width ? _width(data) : fixedWidth;
            const height = _height ? _height(data) : fixedHeight;
            const contentsWidth = _contentsWidth ? _contentsWidth(data) : fixedContentsWidth;
            const contentsHeight = _contentsHeight ? _contentsHeight(data) : fixedContentsHeight;
            const styles = _styles ? _styles(data) : fixedStyles;

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

            updateTitle.call(containerElement, data, { 
                contentsWidth, contentsHeight, actualTitleHeight, actualSubtitleHeight, styles
            });

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
                                    fontMin:styles.textLine.fontMin,
                                    fontMax:styles.textLine.fontMax
                                });
                    })

            paragraphG.exit().call(remove)



        }

        return selection;
    }

    function updateTitle(data, options={}){
        const { contentsWidth, contentsHeight, actualTitleHeight, actualSubtitleHeight, styles } = options;
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
        if (!arguments.length) { return _width || fixedWidth }
        if(typeof value === "function"){ 
            _width = value;
        }
        else{ 
            _width = undefined;
            fixedWidth = value; 
        }

        return component;
    };
    component.height = function (value) {
        if (!arguments.length) { return _height || fixedHeight }
        if(typeof value === "function"){ 
            _height = value; 
        }
        else{ 
            _height = undefined;
            fixedHeight = value; 
        }
        return component;
    };
    component.margin = function (obj) {
        if (!arguments.length) { return margin }
        margin = { ...margin, ...value };
        return component;
    };
    component.styles = function (customStyles) {
        if (!arguments.length) { return styles; }
        if(!customStyles){ return component; }
        //helper
        const addCustomStyles = customStyles => ({
            ...customStyles,
            bg:{ ...fixedStyles.bg, ...customStyles.bg },
            title:{ ...fixedStyles.title, ...customStyles.title },
            subtitle:{ ...fixedStyles.subtitle, ...customStyles.subtitle },
            paragraphTitle:{ ...fixedStyles.paragraphTitle, ...customStyles.paragraphTitle },
            textLine:{ ...fixedStyles.textLine, ...customStyles.textLine },
        });
        if(typeof customStyles === "function"){
            _styles = d => addCustomStyles(customStyles(d));
        }else{
            _styles = undefined;
            fixedStyles = addCustomStyles(customStyles);
        }
        return component;
    };
    return component;
};
