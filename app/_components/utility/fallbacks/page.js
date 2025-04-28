'use client'
import react, { useEffect, useContext } from "react";

/**
 * @description 
 * @param {string} 
 * @returns {ReactNode}
 */
export const NoDataFallback = ({ data, loading, error, fallback = () => null, children }) => {
    return (
      <>
        {!data ? 
          fallback(loading, error)
            :
          children
        }
      </>
    )
}