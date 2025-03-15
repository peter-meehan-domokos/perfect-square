import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import schema from "./schema.js";
//import { spawn } from "child_process";
import { getRehabDataForVisuals, createMockDataForVisuals } from './data/mockData.js';
import  { examples } from "./data/examples.js";

const app = express();
const PORT = 8080;

app.use(cors());

//@todo - make boolean flag graphiql false if env === prod
app.use("/graphql", graphqlHTTP({
    schema,
    graphiql:true
}));

//const values = [121, 9];
//const valuesStr = JSON.stringify(values)
//console.log("userStr", typeof userStr)
/*
const python = spawn('python3', ['./scripts/script.py', 5, valuesStr]);

python.stdout.on("data", data => {
    console.log(`stdout1: ${data}`)
})

python.stdout.on("error", err => {
    console.log(`err1: ${err.message}`)
})

python.stdout.on("close", code => {
    console.log(`close1: ${code}`)
})
*/


app.listen(PORT, () => {
    console.log("server started");
});