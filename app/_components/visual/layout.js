'use client';
import { useContext } from 'react';
import { VisualContext } from './context';
import VisualHeader from './header/page';

/**
 * @description wraps the visual with a header that contains the title, description and controls panel
 *
 * @returns {HTMLElement} the root div that will contain all of the visual-related elements and components
 */
export default function VisualLayout({ children }) {
  //header can be extended on smaller screens where it is not displayed in full
  const { headerExtended } = useContext(VisualContext);
  return (
    <div className="vis-root">
      <VisualHeader />
      <div className={`vis-container ${headerExtended ? "with-extended-header" : ""}`} >
        {children}
      </div>
    </div>
  )
}