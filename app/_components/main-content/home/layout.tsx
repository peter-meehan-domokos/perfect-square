'use client';
import { AppContext } from "@/app/context";
import { PropsWithChildren, useContext } from "react";
import Header from "../../header/page";

/**
 * @description wraps Home with a header where the user will be able to select an example
 *
 * @param {string} exampleKey the selected example, which is passed to the server to retrieve the correct data
 * @returns {ReactElement} the home div, containing the Header and Home components
 */
const HomeLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { device } = useContext(AppContext);
  return (
    <div className={`home ${device}`}>
      <Header />
      <main>{children}</main>
    </div>
  )
}

export default HomeLayout;