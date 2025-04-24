'use client'
import React, { useState, createContext } from "react";

const initTooltipsState = [];
export const TooltipsContext = createContext(initTooltipsState);

export default function TooltipsContextProvider({ children }) {
    const [headerTooltipsData, setHeaderTooltipsData] = useState([]);
    const [chartsViewboxTooltipsData, setChartsViewboxTooltipsData] = useState([]);
    const [loadingTooltipsData, setLoadingTooltipsData] = useState([]);

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