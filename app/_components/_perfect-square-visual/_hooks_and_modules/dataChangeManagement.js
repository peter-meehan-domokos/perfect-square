import react, { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';
import { CHART_OUT_DURATION } from '@/app/constants';

/**
 * @description A hook that manages the process of a change in a data object, determine by a key property of the data. 
 * It performs cleanup, and ensures a smooth transition
 * @param {Ref} visContentsGRef ref to the dom element that contains any visual of the data
 * @param {object} data the latest version of the data
 * @param {function} cleanup the function that should be called whenever old data is being removed
 * 
 * @return {object} the data that is ready to be loaded into the system that utilises this hook
 */
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
      setManagedData(data);
    }
  },[data.key])
  
  return { 
    managedData
  }
};