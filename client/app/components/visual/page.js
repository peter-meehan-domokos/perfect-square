import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import PerfectSquareVisual from '../perfect-square-visual/page';

const GET_EXAMPLE_DATA = gql`
  query getExampleData($exampleKey: String!){
    exampleData(key: $exampleKey){
      data
    }
  }
`

const Visual = ({ exampleKey="" }) => {
    const { data } = useQuery(GET_EXAMPLE_DATA, { variables: { exampleKey }} );
    const [visData, setVisData] = useState(undefined);
    const _visData = {
      ...visData,
      datapoints:visData?.key === "rehab" ? visData.datapoints : [],
    }
    
    useEffect(() => {
        const dataStr = data?.exampleData?.data;
        const dataJSON = dataStr ? JSON.parse(dataStr) : undefined;
        setVisData(dataJSON)
    }, [data])

    return (
        <main className="main">
            <PerfectSquareVisual data={visData} />
        </main>
    )
}
  
export default Visual;