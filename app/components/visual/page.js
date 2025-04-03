'use client'
import { useFetch } from '@/app/api-requests/fetch-hooks';
import { useEffect, useState } from "react";
import PerfectSquareVisual from '../perfect-square-visual/page';

const GET_EXAMPLE_DATA = exampleKey => `
  {
    exampleData(key: "${exampleKey}"){
      data
    }
  }
`

/**
 * @description Fetches the data for the selected example, stores it, and renders the specific visual (PerfectSquareVisual)
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {HTMLElement} A main element containing the PerfectSquareVisual component
 */
const Visual = ({ exampleKey="" }) => {
    const { data, loading } = useFetch(GET_EXAMPLE_DATA(exampleKey));
    const [visData, setVisData] = useState(undefined);
    
    useEffect(() => {
        const dataStr = data?.exampleData?.data;
        const dataJSON = dataStr ? JSON.parse(dataStr) : undefined;
        setVisData(dataJSON)
    }, [data])

    return (
        <main className="main">
            <PerfectSquareVisual data={visData} loading={loading} />
        </main>
    )
}
  
export default Visual;