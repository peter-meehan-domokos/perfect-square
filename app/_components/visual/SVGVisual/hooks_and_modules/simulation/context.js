'use client';
import { createContext, useState } from "react";
import * as d3 from 'd3';

const initPerfectSquareState = {
    selectedChartKey:"",
    selectedQuadrantIndex:null,
    selectedMeasureKey:"",
    zoomTransformState:d3.zoomIdentity,
    setSelectedChartKey:() => {},
    setSelectedQuadrantIndex:() => {},
    setSelectedMeasureKey:() => {},
    setZoomTransformState:() => {}
}
const initVisualState = {
    headerExtended:false,
    setHeaderExtended:() => {},
    ...initPerfectSquareState
}

//export const ZoomContext = createContext(initVisualState);

/**
 * @description Renders either the Intro, or the Header and Visual, depending on the introIsDisplayed flag state
 *
 * @returns {HTMLElement} A div containing either the Intro component, or the Header and Visual Components
 */
/*
export const SimulationContextProvider = ({ children }) => {
    const 

    const context = {
        headerExtended, setHeaderExtended,
        selectedChartKey, setSelectedChartKey,
        selectedQuadrantIndex, setSelectedQuadrantIndex,
        selectedMeasureKey, setSelectedMeasureKey,
        zoomTransformState, setZoomTransformState
    }
    return (
        <ZoomContext.Provider value={context}>
            {children}
        </ZoomContext.Provider>
    )
}
*/