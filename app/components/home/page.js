'use client'
import { useEffect, useState } from 'react';
import { useFetch } from '@/app/api/hooks';
import Intro from '../intro/page';
import Header from '../header/page';
import Visual from '../visual/page';
import { setUpDeviceDetection } from "@/app/helpers/deviceDetectionHelpers";

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
    const [device, setDevice] = useState("");

    useEffect(() => {
      const examples = data?.examples || [];
      setSelectedExampleKey(examples[0]?.key);
    }, [data?.examples])

    useEffect(() => {
      setUpDeviceDetection();
      const mob = window.mobileCheck();
      const mobOrTab = window.mobileAndTabletCheck();
      if(mobOrTab){
        setDevice(mob ? "mobile" : "tablet")
      }else{
        setDevice("laptop-or-pc")
      }
    }, [])

    return (
        <div className={`home ${device}`}>
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