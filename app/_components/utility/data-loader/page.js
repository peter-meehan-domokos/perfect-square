'use client'
import { useEffect, useContext } from "react";
import { useFetch } from '@/app/_api-requests/fetch-hooks';

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {import('react').ReactNode} the PerfectSquareVisual component
 */
const DataLoader = ({ 
  query, 
  save,
  extractData = data => data, 
  successCallback= () => {}, 
  children 
}) => {
    const { data, error, loading } = useFetch(query);

    useEffect(() => {
      const extractedData = data !== null ? extractData(data) : null;
      save({ error, loading, data:extractedData });
      if(extractedData){ 
        successCallback(extractedData)
      };
  }, [data, error, loading])

    return (
        <>{children}</>
    )
}
  
export default DataLoader;