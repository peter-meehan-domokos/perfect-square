'use client';
import Header from "../header/page"
export default function VisualLayout({ menuItems=[], selected, onSelect=()=>{}, openIntro=()=>{}, children }) {
  return (
    <>
      <Header 
          menuItems={menuItems} 
          selected={selected} 
          onSelect={onSelect}
          openIntro={openIntro} 
      />
      <main>{children}</main>
    </>
  )
}