/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import react, { ReactNode, useEffect } from "react";
import { useFetch } from '@/app/_api-requests/fetch-hooks';
import { FunctionalComponentWithNoProps, HandlerFn, QueryResultHandlerFn, Noop } from "@/app/common-types/function-types";

/**
 * @description A wrapper that fetches data using a given query, renders a loading fallback if supplied, and saves the data
 *
 * @param {string} query 
 * @param {function} save 
 * @param {function} extractData 
 * @param {function} successCallback 
 * @param {function} fallback 
 * @param {ReactElement} children
 * 
 * @returns {ReactElement} 
 * 
 */

function DataLoader<T> (props: { 
  query : string, 
  save : QueryResultHandlerFn<T>,
  extractData : (data:any) => T, //@todo - replace any
  successCallback? : HandlerFn<T>,
  loadingFallback? : FunctionalComponentWithNoProps | null,
  children  : ReactNode
}) {
    const { query, save, extractData, successCallback, loadingFallback, children } = props;
    const { data, error, loading } = useFetch(query);

    useEffect(() => {
      const extractedData = data !== null ? extractData(data) : null;
      save({ error, loading, data:extractedData });
      if(extractedData && successCallback){ 
        successCallback(extractedData)
      };
  }, [data, error, loading, /*extractData,save, successCallback*/])

    return (
      <>
        {loadingFallback && loading ? 
          loadingFallback()
            :
          children
        }
      </>
    )
}
  
export default DataLoader;

