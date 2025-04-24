'use client';
import { useContext } from "react";
import { AppContext } from "@/app/context";
import DataLoader from "../utility/data-loader/page";
import { VisualContextProvider } from "../visual/context";
import VisualLayout from '../visual/layout';
import Visual from '../visual/page';
import TooltipsContextProvider from "../visual/SVGVisual/hooks_and_modules/tooltips/context";

const GET_EXAMPLE_DATA = exampleKey => `
  {
    exampleData(key: "${exampleKey}"){
      data
    }
  }
`

//helper
/*const _cleanupNeeded = (prevVisualData, newVisualData) => {
  console.log("cleanupneeded function++++++++")
  console.log("prev", prevVisualData)
  console.log("new", newVisualData)

  return prevVisualData.data && prevVisualData.data?.key !== newVisualData.data?.key ? true : false;
}*/
/**
 * @description Renders either the Intro, or the Header and Visual, depending on the introIsDisplayed flag state
 *
 * @returns {HTMLElement} A div containing either the Intro component, or the Header and Visual Components
 */
const Home = () => {
  const { selectedExampleKey, updateVisualData } = useContext(AppContext);
    return (
      <DataLoader
        query={GET_EXAMPLE_DATA(selectedExampleKey)}
        save={newVisualData => updateVisualData(newVisualData)}
        extractData={data => data.exampleData?.data ? JSON.parse(data.exampleData.data) : null}
      >
        <VisualContextProvider>
          <TooltipsContextProvider>
            <VisualLayout >
              <Visual />
            </VisualLayout>
          </TooltipsContextProvider>
        </VisualContextProvider>
      </DataLoader>
    )
}
  
export default Home;