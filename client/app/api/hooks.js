'use client'
import { useState, useEffect } from "react";

const URL = "http://localhost:8080/graphql";

export const useFetch = (query) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stringifiedQuery = JSON.stringify({ query });

  useEffect(() => {
    //check if fetched previously
    if(data[stringifiedQuery]) { return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        //@todo - learn how to add the graphql query to the request as data
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
  }, [stringifiedQuery, data]);

  return { data:data[stringifiedQuery], loading, error };
};