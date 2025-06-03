'use client'
import React, { PropsWithChildren, Dispatch, SetStateAction, useState, useEffect, createContext, useRef, useCallback } from "react";
import { mobileAndTabletCheck, mobileCheck } from "@/app/_helpers/deviceDetectionHelpers";
import { CHART_OUT_TRANSITION, DELAY_FOR_DOM_CLEAN_UP } from '@/app/constants';
import { Examples, ExampleData, QueryResult } from "./common-types/data-types";
import { HandlerFn } from "./common-types/function-types";

type ExamplesResult = QueryResult<Examples>;
type VisualDataResult = QueryResult<ExampleData>;

type Device = "mobile" | "tablet" | "laptop-or-pc";
interface AppContext {
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
  const currentDataKeyRef = useRef<string | null>(null);

  // Store the current data key for comparison
  useEffect(() => {
    if (visualDataResult.data) {
      currentDataKeyRef.current = visualDataResult.data.key;
    }
  }, [visualDataResult.data]);

  const updateVisualDataResult: HandlerFn<VisualDataResult> = useCallback((newVisualDataResult) => {
    const startCleanup = () => {
      cleanupInProgresRef.current = true;
      pendingVisualDataResultRef.current = newVisualDataResult;
      setVisualDataResult(nullResult);
      setTimeout(() => {
        if (pendingVisualDataResultRef.current) {
          setVisualDataResult(pendingVisualDataResultRef.current);
        }
        pendingVisualDataResultRef.current = null;
        cleanupInProgresRef.current = false;
      }, CHART_OUT_TRANSITION.duration + DELAY_FOR_DOM_CLEAN_UP);
    };

    const cleanupNeeded = currentDataKeyRef.current && newVisualDataResult.data?.key !== currentDataKeyRef.current;
    
    if (cleanupNeeded) {
      startCleanup();
    } else if (cleanupInProgresRef.current) {
      pendingVisualDataResultRef.current = newVisualDataResult;
    } else {
      setVisualDataResult(newVisualDataResult);
    }
  }, []);

  const updateSelectedExample : HandlerFn<string> = useCallback((key) => {
    //wipe visual data if not aligned eg if new data not loaded yet
    if(currentDataKeyRef.current && currentDataKeyRef.current !== key){ 
      updateVisualDataResult(nullResult); }
    setSelectedExampleKey(key);
  }, [updateVisualDataResult])

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