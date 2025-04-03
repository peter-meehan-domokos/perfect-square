'use client'
import { useEffect, useState } from 'react';
import { useFetch } from '@/app/api-requests/fetch-hooks';
import Intro from '../intro/page';
import VisualLayout from '../visual/layout';
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

/**
 * @description Renders either the Intro, or the Header and Visual, depending on the introIsDisplayed flag state
 *
 * @returns {HTMLElement} A div containing either the Intro component, or the Header and Visual Components
 */
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
            <VisualLayout 
              menuItems={data?.examples} 
              selected={selectedExampleKey} 
              onSelect={setSelectedExampleKey}
              openIntro={() => setIntroIsDisplayed(true)}
            >
              <Visual exampleKey={selectedExampleKey} />
            </VisualLayout>
          }
        </div>
    )
}
  
export default Home;