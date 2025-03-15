import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import QuadrantsBarChartVisual from '../quadrantsBarChartVisual/page';

const GET_EXAMPLE_DATA = gql`
  query getExampleData($exampleKey: String!){
    exampleData(key: $exampleKey){
      data
    }
  }
`

const Visual = ({ exampleKey="" }) => {
    //console.log("exampleKey", exampleKey)
    const { data } = useQuery(GET_EXAMPLE_DATA, { variables: { exampleKey }} );
    const [visData, setVisData] = useState(undefined);
    
    useEffect(() => {
        const dataStr = data?.exampleData?.data;
        const dataJSON = dataStr ? JSON.parse(dataStr) : undefined;
        //console.log("dataJson", dataJSON)
        setVisData(dataJSON)
    }, [data])

    return (
        <main className="main">
            <QuadrantsBarChartVisual data={visData} />
        </main>
    )
}
  
export default Visual;