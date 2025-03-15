import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import QuadrantsBarChartVisual from '../quadrantsBarChartVisual/page';

const GET_EXAMPLE_DATA = (key) => gql`
  query getExampleData{
    exampleData(key:"${key}"){
      data
    }
  }
`

const Visual = ({ exampleKey="" }) => {
    //if(!exampleKey) { return null; }
    console.log("exampleKey", exampleKey)
    const { data } = useQuery(GET_EXAMPLE_DATA(exampleKey));
    const [visData, setVisData] = useState(undefined);
    
    useEffect(() => {
        const dataStr = data?.exampleData?.data;
        const dataJSON = dataStr ? JSON.parse(dataStr) : undefined;
        setVisData(dataJSON)
    }, [data])

    return (
        <main className="main">
            <QuadrantsBarChartVisual data={visData} />
        </main>
    )
}
  
export default Visual;