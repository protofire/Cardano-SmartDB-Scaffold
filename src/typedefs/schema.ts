import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLSchema } from 'graphql';
import * as fs from 'fs';

// Leer el archivo y asignar su contenido a una variable
const filePath = 'schema.graphql';
const fileContent = fs.readFileSync(filePath, 'utf-8');

export const typeDefs = gql(fileContent);

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
Handlebars.registerHelper('columnOptions', function(gqfield) {
    let options = `type: ${getTypeORMType(gqfield.type)}`;
    
    // Añade más opciones según sea necesario
    return options;
});

function getTypeORMType(gqlType) {
    switch(gqlType) {
        case 'String':
            return "\"varchar\", length: 255";
        case 'Int':
            return "\"int\"";
        // Añade más casos según sea necesario
        default:
            return "\"varchar\", length: 255";
    }
}

Handlebars.registerHelper('typeORMType', function(gqlType) {
    const gqlToMongooseTypeMap = {
        'String': 'string',
        'Int': 'number',
        'Float': 'number',
        'Boolean': 'boolean',
        'ID': 'string',
        // Agrega más mapeos si es necesario
    };
    return gqlToMongooseTypeMap[gqlType] || 'String';
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

    // Verificar si el tipo es un array
    if (gqlType.endsWith('[]')) {
        // Extraer el tipo base (sin los corchetes)
        const baseType = gqlType.slice(0, -2);
        // Mapear el tipo base y devolverlo como un array
        return `[${gqlToMongooseTypeMap[baseType] || 'String'}]`;
    }

    // Si no es un array, devolver el tipo mapeado o 'String' por defecto
    return gqlToMongooseTypeMap[gqlType] || 'String';
});

export default makeExecutableSchema({
  allowUndefinedInResolve: true,
  typeDefs,
}) as GraphQLSchema;
