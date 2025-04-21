'use client';
import { createContext, useState } from "react";
import * as d3 from 'd3';

const initPerfectSquareState = {
    selectedChartKey:"",
    selectedQuadrantIndex:null,
    selectedMeasureKey:"",
    zoomTransformState:d3.zoomIdentity,
    externallyRequiredZoomTransformObject:null,
    setSelectedChartKey:() => {},
    setSelectedQuadrantIndex:() => {},
    setSelectedMeasureKey:() => {},
    setZoomTransformState:() => {},
    setExternallyRequiredZoomTransformObject:() => {}
}
const initVisualState = {
    headerExtended:false,
    setHeaderExtended:() => {},
    ...initPerfectSquareState
}

export const VisualContext = createContext(initVisualState);

/**
 * @description Renders either the Intro, or the Header and Visual, depending on the introIsDisplayed flag state
 *
 * @returns {HTMLElement} A div containing either the Intro component, or the Header and Visual Components
 */

//next - create the AppCobtextprovider component too, 
//then continue to process stuff inside Visual

export const VisualContextProvider = ({ children }) => {
    const [headerExtended, setHeaderExtended] = useState(false);
    const [selectedChartKey, setSelectedChartKey] = useState("");
    const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
    const [selectedMeasureKey, setSelectedMeasureKey] = useState("");
    //copy of the state that is maintained in zoom hook. Needed here for Header.
    const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity);
    //@todo - change to applyZoom utility funciton in useZoom
    const [externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject] = useState(null);

    const context = {
        headerExtended, setHeaderExtended,
        selectedChartKey, setSelectedChartKey,
        selectedQuadrantIndex, setSelectedQuadrantIndex,
        selectedMeasureKey, setSelectedMeasureKey,
        zoomTransformState, setZoomTransformState,
        externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject
    }
    return (
        <VisualContext.Provider value={context}>
            {children}
        </VisualContext.Provider>
    )
}