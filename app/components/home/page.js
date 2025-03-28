'use client'
import { useEffect, useState } from 'react';
import { useFetch } from '@/app/api/hooks';
import Intro from '../intro/page';
import Header from '../header/page';
import Visual from '../visual/page';

const GET_EXAMPLES = `
  query getExamples{
    examples{
      key,
      name
    }
  }
`
const Home = ({ }) => {
    const { data } = useFetch(GET_EXAMPLES);
    const [introIsDisplayed, setIntroIsDisplayed] = useState(true);
    const [selectedExampleKey, setSelectedExampleKey] = useState("");

    useEffect(() => {
      const examples = data?.examples || [];
      setSelectedExampleKey(examples[0]?.key)
    }, [data?.examples])

    return (
        <div className="home">
          {introIsDisplayed ? 
            <Intro 
              closeIntro={() => setIntroIsDisplayed(false)}
            />
          :
            <>
              <Header 
                menuItems={data?.examples} 
                selected={selectedExampleKey} 
                onSelect={setSelectedExampleKey}
                openIntro={() => setIntroIsDisplayed(true)} 
              />
              <Visual 
                exampleKey={selectedExampleKey} 
              />
            </>
          }
        </div>
    )
}
  
export default Home;