'use client';
import { AppContext } from "@/app/context";
import { useContext } from "react";
import Header from "../header/page";

export default function HomeLayout({ openIntro=()=>{}, children }) {
  const { device } = useContext(AppContext);
  return (
    <div className={`home ${device}`}>
      <Header />
      <main>{children}</main>
    </div>
  )
}