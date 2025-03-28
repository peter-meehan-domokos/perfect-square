'use client'
import { useFetch } from '@/app/api/hooks';
import { useEffect, useState } from "react";
import PerfectSquareVisual from '../perfect-square-visual/page';

const GET_EXAMPLE_DATA = exampleKey => `
  {
    exampleData(key: "${exampleKey}"){
      data
    }
  }
`

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