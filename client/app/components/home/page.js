import { useEffect, useState } from 'react';
import { gql, useQuery } from "@apollo/client";
import Header from '../header/page';
import Visual from '../visual/page';

const GET_EXAMPLES = gql`
  query getExamples{
    examples{
      key,
      name
    }
  }
`

const Home = ({ }) => {
    const { data } = useQuery(GET_EXAMPLES);
    const examples = data?.examples || [];
    const [selectedExampleKey, setSelectedExampleKey] = useState("");

    useEffect(() => {
      setSelectedExampleKey(examples[0]?.key)
    }, [data])

    return (
        <>
          <Header menuItems={examples} selected={selectedExampleKey} onSelect={setSelectedExampleKey} />
          <Visual exampleKey={selectedExampleKey} />
        </>
    )
}
  
export default Home;