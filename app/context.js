'use client'
import React, { useState, useEffect, createContext } from "react";
import { setUpDeviceDetection } from "@/app/_helpers/deviceDetectionHelpers";

const initAppState = {
  introIsDisplayed:false,
  device:null,
  examples:[]
}
export const AppContext = createContext(initAppState);

export default function AppContextProvider({ children }) {
  const [introIsDisplayed, setIntroIsDisplayed] = useState(false);
  const [device, setDevice] = useState("");
  const [examples, setExamples] = useState("");
  const [selectedExample, setSelectedExample] = useState("");
  const [visualData, setVisualData] = useState(undefined);

  const context = {
    introIsDisplayed,
    device,
    examples,
    selectedExample,
    visualData,
    setIntroIsDisplayed,
    setExamples,
    setSelectedExample,
    setVisualData
  }

  useEffect(() => {
    setUpDeviceDetection();
    const mob = window.mobileCheck();
    const mobOrTab = window.mobileAndTabletCheck();
    if(mobOrTab){
      setDevice(mob ? "mobile" : "tablet")
    }else{
      setDevice("laptop-or-pc")
    }
  }, []);

  return (
      <AppContext.Provider value={context}>
          {children}
      </AppContext.Provider>
  );
}