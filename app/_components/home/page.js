'use client';
import { ReactNode, useContext } from "react";
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

/**
 * @description the main app component, which renders the Visual component
 *
 * @returns {ReactNode} A Visual component, wrapped in a layout, some context profvidrrs and a dat loader which 
 * fetches the required data for the visual.
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