'use client'
import React from "react";
import AppContextProvider from "./context";
import MainRouter from "./_components/main-router/page";

export default function App() {
  return (
    <React.StrictMode>
      <AppContextProvider>
        <MainRouter />
      </AppContextProvider>
    </React.StrictMode>
  );
}