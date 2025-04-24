/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import react, { useEffect } from "react";
import { useFetch } from '@/app/_api-requests/fetch-hooks';

/**
 * @description A wrapper that fetches data using a given query, renders a loading fallback if supplied, and saves the data
 *
 * @param {string} query 
 * @param {function} save 
 * @param {function} extractData 
 * @param {function} successCallback 
 * @param {function} fallback 
 * @param {ReactNode} children
 * 
 * @returns {ReactNode} 
 * 
 */
const DataLoader = ({ 
  query, 
  save,
  extractData = data => data, 
  successCallback = () => {}, 
  fallback,
  children 
}) => {
    const { data, error, loading } = useFetch(query);

    useEffect(() => {
      const extractedData = data !== null ? extractData(data) : null;
      save({ error, loading, data:extractedData });
      if(extractedData){ 
        successCallback(extractedData)
      };
  }, [data, error, loading, /*extractData,save, successCallback*/])

    return (
      <>
        {fallback && loading ? 
          fallback()
            :
          children
        }
      </>
    )
}
  
export default DataLoader;