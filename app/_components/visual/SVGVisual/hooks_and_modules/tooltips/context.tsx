'use client'
import React, { PropsWithChildren, Dispatch, SetStateAction, useState, createContext } from "react";
import { Tooltip } from "@/app/_components/visual/types";

type Tooltips = Array<Tooltip>;
type TooltipsContext = {
  tooltipsData : Tooltips,
  setHeaderTooltipsData : Dispatch<SetStateAction<Tooltips>>,
  setChartsViewboxTooltipsData : Dispatch<SetStateAction<Tooltips>>,
  setLoadingTooltipsData : Dispatch<SetStateAction<Tooltips>>
}

const initTooltipsContext : TooltipsContext = {
  tooltipsData : [],
  setHeaderTooltipsData : () => {},
  setChartsViewboxTooltipsData : () => {},
  setLoadingTooltipsData : () => {}
}
const emptyTooltipsArray : Tooltips = [];
export const TooltipsContext = createContext(initTooltipsContext);

/**
 * @description stores state related to tooltips that a child component wil render over the visual
 *
 * @returns {ReactElement} the context provider
 */
const TooltipsContextProvider : React.FC<PropsWithChildren> = ({ children }) => {
    const [headerTooltipsData, setHeaderTooltipsData] = useState(emptyTooltipsArray);
    const [chartsViewboxTooltipsData, setChartsViewboxTooltipsData] = useState(emptyTooltipsArray);
    const [loadingTooltipsData, setLoadingTooltipsData] = useState(emptyTooltipsArray);

    const tooltipsData = [
        ...headerTooltipsData, 
        ...chartsViewboxTooltipsData,
        ...loadingTooltipsData
    ];

    const context = {
        setHeaderTooltipsData,
        setChartsViewboxTooltipsData,
        setLoadingTooltipsData,
        tooltipsData
    }

  return (
    <TooltipsContext.Provider value={context}>
        {children}
    </TooltipsContext.Provider>
  );
}

export default TooltipsContextProvider;