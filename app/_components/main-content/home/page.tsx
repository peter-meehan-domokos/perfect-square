'use client';
import { useCallback, useContext } from "react";
import { QueryResultHandlerFn } from "@/app/common-types/function-types";
import { AppContext } from "@/app/context";
import DataLoader from "../../utility/data-loader/page";
import { VisualContextProvider } from "../../visual/context";
import VisualLayout from '../../visual/layout';
import Visual from '../../visual/page';
import TooltipsContextProvider from "../../visual/SVGVisual/hooks_and_modules/tooltips/context";

const GET_EXAMPLE_DATA = (exampleKey: string) => `
  {
    exampleData(key: "${exampleKey}"){
      data
    }
  }
`

interface ExampleDataResultWrapper {
  exampleData:{
    //the data received is stringified on the server, separately to the query stringification
    data: string //ExampleData
  }
}

/**
 * @description the main app component, which renders the Visual component
 *
 * @returns {ReactElement} A Visual component, wrapped in a layout, some context profvidrrs and a dat loader which 
 * fetches the required data for the visual.
 */

const Home = () => {
  const { selectedExampleKey, updateVisualDataResult } = useContext(AppContext);
  const extractData = useCallback((data:ExampleDataResultWrapper) => JSON.parse(data.exampleData.data), [])

  if(!selectedExampleKey){
    return null;
  }

  return (
      <DataLoader
        query={GET_EXAMPLE_DATA(selectedExampleKey)}
        save={updateVisualDataResult}
        extractData={extractData}
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