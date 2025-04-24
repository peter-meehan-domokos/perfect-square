import ReactNode, { useContext } from "react";
import { AppContext } from "@/app/context";
import DataLoader from "../utility/data-loader/page";
import Intro from "../intro/page";
import HomeLayout from "../home/layout";
import Home from "../home/page";

const GET_EXAMPLES = `
  query getExamples{
    examples{
      key,
      name
    }
  }
`

/**
 * @description Renders the appropriate component, either the intro or the home page
 * Note, whilst it is called a router, there aren't currently any actual routes, but achieves the same objective

 * @returns {ReactNode} 
 */
export default function MainRouter() {
    const { introIsDisplayed, setIntroIsDisplayed } = useContext(AppContext);
    return (
      <>
        {introIsDisplayed ? 
          <Intro closeIntro={() => setIntroIsDisplayed(false)} />
          :
          <HomePage/>
        }
      </>
    );
}

/**
 * @description Renders Home, wrapped in a DataLoader to get the examples for the menu
 * 
 * @returns {ReactNode} 
 */
const HomePage = () => {
  const { setIntroIsDisplayed, updateSelectedExample, setExamples } = useContext(AppContext);
  return (
    <DataLoader 
      query={GET_EXAMPLES} 
      save={setExamples}
      extractData={data => data.examples}
      successCallback={extractedData => updateSelectedExample(extractedData[0]?.key)}
    >
        <HomeLayout
            openIntro={() => setIntroIsDisplayed(true)}
        >
          <Home />
        </HomeLayout>
    </DataLoader>
  )
}