import React, { useContext, useCallback } from "react";
import { AppContext } from "@/app/context";
import DataLoader from "../utility/data-loader/page";
import HomeLayout from "./home/layout";
import Home from "./home/page";
import { HandlerFn } from "@/app/common-types/function-types";
import { Examples } from "@/app/common-types/data-types";

const GET_EXAMPLES = `
  query getExamples{
    examples{
      key,
      name
    }
  }
`

interface ExamplesWrapper {
  examples:Examples
}

/**
 * @description Renders Home, wrapped in a DataLoader to get the examples for the menu
 * 
 * @returns {ReactElement} 
 */
 const MainContent : React.FC<{}> = () => {
    const { setIntroIsDisplayed, updateSelectedExample, setExamplesResult } = useContext(AppContext);
    const successCallback : HandlerFn<Examples> = useCallback(
      (extractedExampleData) => updateSelectedExample(extractedExampleData[0]?.key), //set first example as selected initially
      [updateSelectedExample]
    );
  
    return (
      <DataLoader<Examples>
        query={GET_EXAMPLES} 
        save={setExamplesResult}
        extractData={(data:ExamplesWrapper) => data.examples}
        successCallback={successCallback}
      >
          <HomeLayout>
            <Home />
          </HomeLayout>
      </DataLoader>
    )
  }
  
  export default MainContent;