'use client'
import { useState, useEffect } from "react";

const URL = process.env.NODE_ENV === "development" ?
  "http://localhost:8080/graphql" :
  "https://data-server-e2504705c003.herokuapp.com/graphql";

export const useFetch = (query) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stringifiedQuery = JSON.stringify({ query });
  const _q = query.includes("getExamples") ? "get-examples" : query

  useEffect(() => {
    //check if fetched previously
    if(data[stringifiedQuery]) { return; }
    if(loading){ return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(URL, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: stringifiedQuery
        });
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        setLoading(false);
        //store with key=stringifiedQuery
        setData(prevState => ({ ...prevState, [stringifiedQuery]: json.data }));
        setError(null);
      } catch (error) {
        setError(`${error} Could not Fetch Data `);
        setLoading(false);
      }
    };
    fetchData();
  }, [stringifiedQuery, data, loading]);

  return { data:data[stringifiedQuery] || null, loading, error };
};