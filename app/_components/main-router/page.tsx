import { useContext } from "react";
import { AppContext } from "@/app/context";
import Intro from "../intro/page";
import MainContent from "../main-content/page";

/**
 * @description Renders the appropriate component, either the intro or the home page
 * Note, whilst it is called a router, there aren't currently any actual routes, but achieves the same objective

 * @returns {ReactElement} 
 */


const MainRouter: React.FC<{}> = () => { 
    const { introIsDisplayed, setIntroIsDisplayed } = useContext(AppContext);
    return (
      <>
        {introIsDisplayed ? 
          <Intro />
          :
          <MainContent/>
        }
      </>
    );
}

export default MainRouter;