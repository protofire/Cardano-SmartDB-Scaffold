import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLSchema } from 'graphql';

export const typeDefs = gql`
  directive @entity on OBJECT
  directive @smartDBEntity on OBJECT
  directive @resolvers on OBJECT
  directive @query(collection: String!, query: String = "{}", sort: String = "{}", limit: Int) on FIELD
  directive @map(toField: String!) on FIELD
  directive @util(fromContext: String, momentFormat: String, objectField: String) on FIELD
  directive @link(collection: String!, objectField: String!, queryField: String!) on FIELD

  type Dummy @smartDBEntity {
    _NET_id_TN: String
    ddPaymentPKH: String
    ddStakePKH: String
    ddValue: Int
  }

  type Test @entity {
    name: String
    description: String
  } 

  type Producto @entity {
    name: String
    description: String
    precio: Int
  }

  type Query @resolvers {
    test: [Test] @query(collection: "tests", sort: "{ createdAt: 1 }")
    dummy: [Dummy] @query(collection: "dummys")
  }

  schema {
    query: Query
  }
`;

const Handlebars = require('handlebars');

// Tu función de conversión
const gqlToTsTypeMap = {
    'String': 'string',
    'Int': 'number',
    'Float': 'number',
    'Boolean': 'boolean',
    'ID': 'string',
    // Agrega más mapeos según sea necesario
};

function convertGqlTypeToTs(gqlType) {
    return gqlToTsTypeMap[gqlType] || gqlType;
}

// Registrando el helper en Handlebars
Handlebars.registerHelper('convertGqlTypeToTs', function(gqlType) {
    return convertGqlTypeToTs(gqlType);
});

// Helper para convertir a minúsculas
Handlebars.registerHelper('toLowerCase', function(text) {
    if (typeof text !== 'string') {
        return text;
    }
    return text.toLowerCase();
});
// Helper para convertir tipos de GraphQL a TypeScript
Handlebars.registerHelper('convertType', function(gqlType) {
    const gqlToTsTypeMap = {
        'String': 'string',
        'Int': 'number',
        'Float': 'number',
        'Boolean': 'boolean',
        'ID': 'string',
        // Agrega más mapeos si es necesario
    };
    return gqlToTsTypeMap[gqlType] || gqlType;
});

// Helper para convertir tipos de GraphQL a tipos de Mongoose
Handlebars.registerHelper('mongooseType', function(gqlType) {
    const gqlToMongooseTypeMap = {
        'String': 'String',
        'Int': 'Number',
        'Float': 'Number',
        'Boolean': 'Boolean',
        'ID': 'String',
        // Agrega más mapeos si es necesario
    };
    return gqlToMongooseTypeMap[gqlType] || 'String';
});
export default makeExecutableSchema({
  allowUndefinedInResolve: true,
  typeDefs,
}) as GraphQLSchema;
