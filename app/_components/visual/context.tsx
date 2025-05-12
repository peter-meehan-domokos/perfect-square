'use client';
import { PropsWithChildren, Dispatch, SetStateAction, createContext, useState } from "react";
import * as d3 from 'd3';
import { ZoomTransform } from "d3-zoom";
import { DEFAULT_DISPLAY_SETTINGS } from "../perfect-square/constants";
import { HandlerFnWithNoArgs } from "@/app/common-types/function-types";
import { DisplaySettings, Transition } from "@/app/common-types/data-types";

type ExternallyRequiredZoomTransformObject = {
    requiredTransform: ZoomTransform,
    requiredTransition: Transition, 
    callback: HandlerFnWithNoArgs
}

type PerfectSquareContext = {
    selectedChartKey: string,
    selectedQuadrantIndex: number | null,
    selectedMeasureKey: string,
    setSelectedChartKey: Dispatch<SetStateAction<string>>,
    setSelectedQuadrantIndex: Dispatch<SetStateAction<number | null>>,
    setSelectedMeasureKey: Dispatch<SetStateAction<string>>,
}

type ExternalZoomContext = {
    zoomTransform : ZoomTransform,
    setZoomTransform: Dispatch<SetStateAction<ZoomTransform>>,
    externallyRequiredZoomTransformObject:ExternallyRequiredZoomTransformObject | null,
    setExternallyRequiredZoomTransformObject:Dispatch<SetStateAction<ExternallyRequiredZoomTransformObject | null>>
}

type HeaderContext = {
    headerExtended:boolean,
    setHeaderExtended:Dispatch<SetStateAction<boolean>>
}

type DisplayContext = {
    displaySettings: DisplaySettings,
    setDisplaySettings:Dispatch<SetStateAction<DisplaySettings>>
}

type VisualContext = PerfectSquareContext & ExternalZoomContext & DisplayContext & HeaderContext;

const initPerfectSquareContext : PerfectSquareContext = {
    selectedChartKey:"",
    selectedQuadrantIndex:null,
    selectedMeasureKey:"",
    setSelectedChartKey:(key) => {},
    setSelectedQuadrantIndex:(i) => {},
    setSelectedMeasureKey:(key) => {},
}


const initExternalZoomContext : ExternalZoomContext  = {
    zoomTransform: d3.zoomIdentity,
    setZoomTransform: zoomTransform => {},
    externallyRequiredZoomTransformObject : null,
    setExternallyRequiredZoomTransformObject: (obj) => {}
}

const initDisplayContext : DisplayContext = {
    displaySettings:DEFAULT_DISPLAY_SETTINGS,
    setDisplaySettings:(settings) => {}
}

const initHeaderContext : HeaderContext = {
    headerExtended : false,
    setHeaderExtended:() => false,
}

const initVisualContext : VisualContext = {
    ...initPerfectSquareContext,
    ...initExternalZoomContext,
    ...initDisplayContext,
    ...initHeaderContext
}

export const VisualContext = createContext(initVisualContext);

/**
 * @description stores state related to the visual
 *
 * @returns {ReactElement} the context provider
 */
export const VisualContextProvider : React.FC<PropsWithChildren> = ({ children }) => {
    const [headerExtended, setHeaderExtended] = useState(false);
    const [selectedChartKey, setSelectedChartKey] = useState("");
    const [selectedQuadrantIndex, setSelectedQuadrantIndex] = useState<number | null>(null);
    const [selectedMeasureKey, setSelectedMeasureKey] = useState("");
    //copy of the state that is maintained in zoom hook. Needed here for Header.
    const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);
    const [externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject] 
        = useState<ExternallyRequiredZoomTransformObject | null>(null);
    const [displaySettings, setDisplaySettings] = useState(DEFAULT_DISPLAY_SETTINGS)

    const perfectSquareContext : PerfectSquareContext = {
        selectedChartKey, setSelectedChartKey,
        //next - get teh correct type for setstate funcs
        selectedQuadrantIndex, setSelectedQuadrantIndex,
        selectedMeasureKey, setSelectedMeasureKey,
    }

    const externalZoomContext : ExternalZoomContext = {
        zoomTransform, setZoomTransform,
        externallyRequiredZoomTransformObject, setExternallyRequiredZoomTransformObject,
    }
    const displayContext : DisplayContext = {
        displaySettings, setDisplaySettings
    }
    const headerContext : HeaderContext = {
        headerExtended, setHeaderExtended
    }

    const context = {
        ...perfectSquareContext,
        ...externalZoomContext,
        ...displayContext,
        ...headerContext,
    }

    return (
        <VisualContext.Provider value={context}>
            {children}
        </VisualContext.Provider>
    )
}