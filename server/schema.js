import { graphqlHTTP } from "express-graphql";
import { GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import  { examples } from "./data/examples.js";
import { getRehabDataForVisuals, createMockDataForVisuals } from "./data/mockData.js";

const ExampleType = new GraphQLObjectType({
    name:"Example",
    fields:{
        key:{ type:GraphQLString },
        name:{ type:GraphQLString }
    }
})

const ExampleDataType = new GraphQLObjectType({
    name:"ExampleData",
    fields:{
        //next - change this fork string to full data object (how detailed must it be?)
        //or should we just convert to json?
        //maybe do as str, but add a key filed, and this should be a ref to ExampleType
        //so need to learn how to do that (eg like refs in mongoDB)
        key:{ type:GraphQLString },
        data: { type:GraphQLString }
    }
})

const RootQueryType = new GraphQLObjectType({
    name:"Query",
    fields:{
        examples:{
            type: new GraphQLList(ExampleType),
            resolve:(parent, args) => {
                return examples;
            }
        }
        ,
        exampleData:{
            type:ExampleDataType,
            args:{ key:{ type:GraphQLString } },
            resolve:(parent, args) => {
                const { key } = args;
                if(key === "rehab"){
                    return { 
                        key,
                        data:JSON.stringify(getRehabDataForVisuals(24))
                    }
                }
                if(key === "generic_data_500"){
                    return { 
                        key,
                        data:JSON.stringify(createMockDataForVisuals(500)) 
                    }
                }else {
                    
                }
            }
        }
    }
})

export default new GraphQLSchema({
    query:RootQueryType
})
