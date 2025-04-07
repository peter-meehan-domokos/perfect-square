import { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';
import { CHART_OUT_DURATION } from '@/app/constants';

//hook
export const useDataChangeManagement = (visContentsGRef, data, cleanup=()=>{}) => {
  const [managedData, setManagedData] = useState({});
  const cleanupInProgressRef = useRef(false);
  const dataWaitingRef = useRef(null);
  
  useEffect(() => {
    //reset perfectSquare component if required
    const cleanupNeeded = visContentsGRef.current && !d3.select(visContentsGRef.current).selectAll(".chart").empty() && !cleanupInProgressRef.current;
    if(cleanupNeeded){
      cleanupInProgressRef.current = true;
      dataWaitingRef.current = data;
      setTimeout(() => {
        cleanup();
        cleanupInProgressRef.current = false;
        //load the waiting data
        const dataToRender = dataWaitingRef.current;
        dataWaitingRef.current = null;
        setManagedData(dataToRender);

      }, CHART_OUT_DURATION);
    }else if(cleanupInProgressRef.current){
      //update dataWaiting to the latest
      dataWaitingRef.current = data;
    }else{
      //safe to load new data immediately
      //setSizesAndTriggerDataRendering(data);
      setManagedData(data);
    }
  },[data.key])
  
  return { 
    managedData
  }
};