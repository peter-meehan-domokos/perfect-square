'use client'
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import Home from "./components/home/page";

const client = new ApolloClient({
  uri:"http://localhost:8080/graphql",
  cache:new InMemoryCache()
});

export default function App() {
  return (
    <>
      <ApolloProvider client={client}>
        <div className="app">
          <Home />
        </div>
      </ApolloProvider>
    </>
  );
}
