import * as d3 from "d3";
import { isNumber } from './dataHelpers';
import { FADE_IN_DURATION, FADE_OUT_DURATION } from "../constants";

export function getElementDimns(){
    return {
        width:this.getBoundingClientRect().width,
        height: this.getBoundingClientRect().height
    }
}

export function fadeIn(selection, options={}){
    const { transition, cb=()=>{}, display=null, opacity=1 } = options;
    selection.each(function(){
        //will be multiple exits because of the delay in removing
        const sel = d3.select(this);
        const isFadingIn = sel.attr("class").includes("fading-in");
        const currOpacity = sel.attr("opacity") ? +sel.attr("opacity") : 0;
        const currDisplay = sel.attr("display") || sel.style("display") || null;;
        const somethingMustChange = currOpacity !== opacity || currDisplay !== display;
        if(!isFadingIn && somethingMustChange){
            d3.select(this)
                .style("opacity", 0)
                //adjust display if required or if new value passed in
                .style("display", currDisplay !== display ? display : currDisplay)
                .classed("fading-in", true)
                .transition("fade-in")
                    .delay(transition?.delay || 0)
                    .duration(isNumber(transition?.duration) ? transition.duration : FADE_IN_DURATION.MED) //WAS CONTENT_FADE_DURATION FOR KPIS
                    .style("opacity", opacity)
                    .style("display", display)
                    .on("end", function() { 
                        d3.select(this).classed("fading-in", false); 
                        cb.call(this);
                    });
        }
    })
}


export function fadeOut(selection, options={}){
    const { transition, cb=()=>{}, shouldRemove, display="none", opacity=0 } = options;
    selection.each(function(){
        //will be multiple exits because of the delay in removing
        const sel = d3.select(this);
        const isFadingOut = sel.attr("class").includes("fading-out");
        const currOpacity = sel.style("opacity") ? +sel.style("opacity") : null;
        const currDisplay = sel.style("display");
        const somethingMustChange = currOpacity !== opacity || currDisplay !== display;
       
        if(!isFadingOut && somethingMustChange){
            d3.select(this)
                .style("opacity", d3.select(this).style("opacity") || 1)
                .classed("fading-out", true)
                .transition("fade-out")
                    .delay(transition?.delay || 0)
                    //.duration(transition?.duration || CONTENT_FADE_DURATION) - OLD, FOR KPIS
                    .duration(isNumber(transition?.duration) ? transition.duration : FADE_OUT_DURATION.MED)
                    .style("opacity", opacity)
                    .on("end", function() { 
                        if(shouldRemove){ 
                            d3.select(this).remove(); 
                        }
                        else{
                            d3.select(this)
                                .style("display", display)
                                .classed("fading-out", false); 
                        }
                        cb.call(this);
                    });
        }
    })
}

export function remove(selection, options={}){ 
    return fadeOut(selection, { ...options, shouldRemove:true })
}

