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

/*export const ZoomContextProvider = ({ children }) => {
    const [zoomTransformState, setZoomTransformState] = useState(false);
    const [zoomingInProgress, setZoomingInProgress] = useState("");
    const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
    const [selectedMeasureKey, setSelectedMeasureKey] = useState("");
    //copy of the state that is maintained in zoom hook. Needed here for Header.
    const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity);

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
}*/