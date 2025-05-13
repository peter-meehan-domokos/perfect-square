'use client'
import React, { useState, useEffect, createContext, useRef } from "react";
import { setUpDeviceDetection } from "@/app/_helpers/deviceDetectionHelpers";
import { CHART_OUT_TRANSITION, DELAY_FOR_DOM_CLEAN_UP } from '@/app/constants';

const nullVisualData = { data: null, loading: false, error: null };
const initAppState = {
  introIsDisplayed:true,
  device:null,
  examples:[],
  selectedExampleKey:"",
  visualData:nullVisualData
}
export const AppContext = createContext(initAppState);

/**
 * @description stores state related to the app, which includes the data that is provided to the visual.
 * Manages updates to the visual data, too allow a smooth cleanup and transition, for example removing any zoomstate
 *
 * @returns {ReactNode} the context provider
 */
export default function AppContextProvider({ children }) {
  const [introIsDisplayed, setIntroIsDisplayed] = useState(true);
  const [device, setDevice] = useState("");
  const [examples, setExamples] = useState("");
  const [selectedExampleKey, setSelectedExampleKey] = useState("");
  const [visualData, setVisualData] = useState(nullVisualData);

  const cleanupInProgresRef = useRef(false);
  const pendingVisualDataRef = useRef(null);

  //managed updates
  const updateSelectedExample = key => {
    //wipe visual data if not aligned eg if new data not loaded yet
    if(visualData.data && visualData.data.key !== key){ 
      updateVisualData(nullVisualData); }
    setSelectedExampleKey(key);
  }

  const updateVisualData = (newVisualData) => {
    //helper
    //this function provides time between data changes for the dom to be cleaned up smoothly elsewhere eg zoom reset,
    const startCleanup = () => {
      cleanupInProgresRef.current = true;
      //update the pending visualData
      pendingVisualDataRef.current = newVisualData;
      setVisualData(nullVisualData);
      setTimeout(() => {
        //guard against case of home page being re-mounted if user toggle between intro and home quickly
        if(pendingVisualDataRef.current) {
          setVisualData(pendingVisualDataRef.current)
        }
        pendingVisualDataRef.current = null;
        cleanupInProgresRef.current = false;
      }, CHART_OUT_TRANSITION.duration + DELAY_FOR_DOM_CLEAN_UP)
    }
    
    //3 cases:start a cleanup, update pending, or set data straight away
    const cleanupNeeded = visualData.data && visualData.data?.key !== newVisualData.data?.key;
    if(cleanupNeeded){
      startCleanup();
    }
    else if(cleanupInProgresRef.current){
      //just update pending until cleanup completes
      pendingVisualDataRef.current = newVisualData;
    }
    else {
      //can set data immediately
      setVisualData(newVisualData);
    }
  }

  const context = {
    introIsDisplayed,
    device,
    examples,
    selectedExampleKey,
    visualData,
    setIntroIsDisplayed,
    setExamples,
    updateSelectedExample,
    updateVisualData
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