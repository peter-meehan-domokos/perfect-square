'use client'
import { useContext } from "react";
import { AppContext } from "@/app/context";
import { robotoFont, robotoBoldFont } from '@/app/assets/fonts';

/**
 * @description Contains a title and a menu list of examples that he user can choose between
 *
 * @param {Array} menuItems the option objects that the user can chose between
 * @param {string} selected the key of the current option
 * @param {function} onSelect a handler for the user clicking an option to select it
 * @param {function} openIntro a handler for a separate link to go back to the intro, should the user wich to do so
 * 
 * @returns {ReactElement} A header element containing a title, a link button to the intro, and a menu list
 */
const Header = () => {
    const { examplesResult, selectedExampleKey, updateSelectedExample, setIntroIsDisplayed } = useContext(AppContext);
    return (
      <header className="header">
          <button className="intro-link" onClick={setIntroIsDisplayed} >
              Back to intro
          </button>
          <div className={`vis-title ${robotoBoldFont.className}`}>
            The Perfect Square Examples
          </div>
          <ul className="menu">
              {examplesResult.data?.map(item => 
                  <li
                      key={`item-${item.key}`} 
                      className={`item ${selectedExampleKey === item.key ? "selected" : ""} ${robotoFont.className}`}
                      onClick = {() => updateSelectedExample(item.key)}
                  >
                      {item.name}
                  </li>
              )}
          </ul>
      </header>
    )
  }
  
  export default Header;