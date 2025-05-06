'use client'
import React, { PropsWithChildren, Dispatch, SetStateAction, useState, useEffect, createContext, useRef } from "react";
import { mobileAndTabletCheck, mobileCheck } from "@/app/_helpers/deviceDetectionHelpers";
import { CHART_OUT_TRANSITION, DELAY_FOR_DOM_CLEAN_UP } from '@/app/constants';
import { Examples, ExampleData, QueryResult } from "./common-types/data-types";
import { HandlerFn } from "./common-types/function-types";

type ExamplesResult = QueryResult<Examples>;
type VisualDataResult = QueryResult<ExampleData>;

type Device = "mobile" | "tablet" | "laptop-or-pc";
type AppContext = {
  introIsDisplayed : boolean,
  device : Device | "",
  examplesResult : ExamplesResult,
  selectedExampleKey : string,
  visualDataResult : VisualDataResult,
  setIntroIsDisplayed : Dispatch<SetStateAction<boolean>>,
  setExamplesResult : Dispatch<SetStateAction<ExamplesResult>>,
  updateSelectedExample : HandlerFn<string>,
  updateVisualDataResult : HandlerFn<VisualDataResult>,
}
const nullResult = { data: null, loading: false, error: null };
const initAppContext : AppContext = {
  introIsDisplayed:true,
  device:"",
  examplesResult:nullResult,
  selectedExampleKey:"",
  visualDataResult:nullResult,
  setIntroIsDisplayed:(isDisplayed) => {},
  setExamplesResult:() => {},
  updateSelectedExample:(example) => {},
  updateVisualDataResult:(dataResult) => {},
}

export const AppContext = createContext(initAppContext);

/**
 * @description stores state related to the app, which includes the data that is provided to the visual.
 * Manages updates to the visual data, too allow a smooth cleanup and transition, for example removing any zoomstate
 *
 * @returns {ReactElement} the context provider
 */
const AppContextProvider : React.FC<PropsWithChildren> = ({ children }) => {
  const [introIsDisplayed, setIntroIsDisplayed] = useState(true);
  const [device, setDevice] = useState<Device | "">("");
  const [examplesResult, setExamplesResult] = useState<ExamplesResult>(nullResult);
  const [selectedExampleKey, setSelectedExampleKey] = useState("");
  const [visualDataResult, setVisualDataResult] = useState<VisualDataResult>(nullResult);

  const cleanupInProgresRef = useRef(false);
  const pendingVisualDataResultRef = useRef<VisualDataResult | null>(null);

  //managed updates
  const updateSelectedExample : HandlerFn<string> = key => {
    //wipe visual data if not aligned eg if new data not loaded yet
    if(visualDataResult.data && visualDataResult.data.key !== key){ 
      updateVisualDataResult(nullResult); }
    setSelectedExampleKey(key);
  }

  const updateVisualDataResult : HandlerFn<VisualDataResult> = (newVisualDataResult) => {
    //helper
    //this function provides time between data changes for the dom to be cleaned up smoothly elsewhere eg zoom reset,
    const startCleanup = () => {
      cleanupInProgresRef.current = true;
      //update the pending visualDataResult
      pendingVisualDataResultRef.current = newVisualDataResult;
      setVisualDataResult(nullResult);
      setTimeout(() => {
        //guard against case of home page being re-mounted if user toggle between intro and home quickly
        if(pendingVisualDataResultRef.current) {
          setVisualDataResult(pendingVisualDataResultRef.current)
        }
        pendingVisualDataResultRef.current = null;
      }, CHART_OUT_TRANSITION.duration + DELAY_FOR_DOM_CLEAN_UP)
    }
    
    //3 cases:start a cleanup, update pending, or set data straight away
    const cleanupNeeded = visualDataResult.data && visualDataResult.data?.key !== newVisualDataResult.data?.key;
    if(cleanupNeeded){
      startCleanup();
    }
    else if(cleanupInProgresRef.current){
      //just update pending until cleanup completes
      pendingVisualDataResultRef.current = newVisualDataResult;
    }
    else {
      //can set data immediately
      setVisualDataResult(newVisualDataResult);
    }
  }

  const context = {
    introIsDisplayed,
    device,
    examplesResult,
    selectedExampleKey,
    visualDataResult,
    setIntroIsDisplayed,
    setExamplesResult,
    updateSelectedExample,
    updateVisualDataResult
  }

  useEffect(() => {
    const mob = mobileCheck();
    const mobOrTab = mobileAndTabletCheck();
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

export default AppContextProvider;