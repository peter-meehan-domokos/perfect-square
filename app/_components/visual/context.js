'use client';
import { ReactNode, createContext, useState } from "react";
import * as d3 from 'd3';
import { DEFAULT_DISPLAY_SETTINGS } from "../perfect-square/constants";

const initPerfectSquareState = {
    selectedChartKey:"",
    selectedQuadrantIndex:null,
    selectedMeasureKey:"",
    zoomTransformState:d3.zoomIdentity,
    externallyRequiredZoomTransformObject:null,
    displaySettings:DEFAULT_DISPLAY_SETTINGS,
    setSelectedChartKey:() => {},
    setSelectedQuadrantIndex:() => {},
    setSelectedMeasureKey:() => {},
    setZoomTransformState:() => {},
    setExternallyRequiredZoomTransformObject:() => {},
    setDisplaySettings:() => {}
}
const initVisualState = {
    headerExtended:false,
    setHeaderExtended:() => {},
    ...initPerfectSquareState
}

export const VisualContext = createContext(initVisualState);

/**
 * @description stores state related to the visual
 *
 * @returns {ReactNode} the context provider
 */
export const VisualContextProvider = ({ children }) => {
    const [headerExtended, setHeaderExtended] = useState(false);
    const [selectedChartKey, setSelectedChartKey] = useState("");
    const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState(null);
    const [selectedMeasureKey, setSelectedMeasureKey] = useState("");
    //copy of the state that is maintained in zoom hook. Needed here for Header.
    const [zoomTransformState, setZoomTransformState] = useState(d3.zoomIdentity);
    const [externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject] = useState(null);
    const [displaySettings, setDisplaySettings] = useState(DEFAULT_DISPLAY_SETTINGS)

    const context = {
        headerExtended, setHeaderExtended,
        selectedChartKey, setSelectedChartKey,
        selectedQuadrantIndex, setSelectedQuadrantIndex,
        selectedMeasureKey, setSelectedMeasureKey,
        zoomTransformState, setZoomTransformState,
        externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject,
        displaySettings, setDisplaySettings
    }
    return (
        <VisualContext.Provider value={context}>
            {children}
        </VisualContext.Provider>
    )
}