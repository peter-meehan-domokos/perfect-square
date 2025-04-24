import react, { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';
import { CHART_OUT_DURATION } from '@/app/constants';

/**
 * @description A hook that manages the process of a change in a data object 
 * It performs cleanup, and ensures a smooth transition
 * @param {Ref} contentsGRef ref to the dom element that contains any visual of the data
 * @param {object} data the latest version of the data
 * @param {function} cleanup the function that should be called whenever old data is being removed
 * 
 * @return {object} the data that is ready to be loaded into the system that utilises this hook
 */
export const useDataChangeManagement = (contentsGRef, data, cleanup=()=>{}, cleanupDuration=0) => {
  const [managedData, setManagedData] = useState({});
  const cleanupInProgressRef = useRef(false);
  const dataWaitingRef = useRef(null);
  
  useEffect(() => {
    const chartsAreRendered = !d3.select(contentsGRef.current).selectAll(".chart").empty();
    const cleanupNeeded = contentsGRef.current && chartsAreRendered && !cleanupInProgressRef.current;
    if(cleanupNeeded){
      console.log("CLEANUP------------", data)
      cleanupInProgressRef.current = true;
      dataWaitingRef.current = data;
      setManagedData({ key:"temp", datapoints:[] });
      //cleanup();
      setTimeout(() => {
        cleanup();
        cleanupInProgressRef.current = false;
        //load the waiting data
        const dataToRender = dataWaitingRef.current;
        dataWaitingRef.current = null;
        setManagedData(dataToRender);
      }, cleanupDuration);
    }else if(cleanupInProgressRef.current){
      console.log("cleanupinprogress!!!!!!!!")
      //update dataWaiting to the latest
      dataWaitingRef.current = data;
    }else{
      console.log("no cleanup so setting data")
      setManagedData(data);
    }
  },[data, contentsGRef, cleanup])
  
  return managedData || {};
};