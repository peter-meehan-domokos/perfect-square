/* eslint react-hooks/exhaustive-deps: 0 */
'use client'
import react, { ReactNode, useEffect } from "react";
import { useFetch } from '@/app/_api-requests/fetch-hooks';
import { FunctionalComponentWithNoProps, HandlerFn, Noop } from "@/app/common-types/function-types";
import { Examples, GetExamplesResponseType } from "@/app/common-types/data-types";

//todo - use
//type PropsWithChildren<P> = P & { children?: ReactNode };
/*
//todo - use generic T, and may be better to have all server responses to be .data rather than .examples etc
type DataLoaderProps<T> = {
  query: String,
  save : HandlerFn<T>,
  //work out how to represent an object with a property of some sort that has value T..maybe we cant and we define it in the calling component
  extractData: (data:object) => T,
  successCallback: HandlerFn<T>,
  //todo - use Reacts built-in type for a FC with no props
  loadingFallback: FunctionalComponentWithNoProps | null
}
*/

type ExamplesResponseResultWithExtractedData = {
  data:Examples | null,
  error: Error | null,
  loading: boolean | null
}

type ExamplesDataLoaderProps = {
  query: String,
  save : HandlerFn<ExamplesResponseResultWithExtractedData>,
  //work out how to represent an object with a property of some sort that has value T..maybe we cant and we define it in the calling component
  extractData: (data:GetExamplesResponseType) => Examples,
  successCallback?: (data: Examples) => void,
  //todo - use Reacts built-in type for a FC with no props
  loadingFallback?: FunctionalComponentWithNoProps | null,
  children: ReactNode //todo - use PropsWithChildren
}


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
const DataLoader : React.FC<ExamplesDataLoaderProps> = ({ 
  query = "", 
  save = () => {},
  //this must change when generic
  //extractData = (data:Examples) => data, 
  extractData,
  successCallback, 
  loadingFallback,
  children 
}) => {
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
