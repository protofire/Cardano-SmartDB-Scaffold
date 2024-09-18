import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import { GraphQLSchema } from 'graphql';

// Read the gql-gen.json file
const gqlGenConfigPath = path.resolve(__dirname, './config/gql-gen.json');
const gqlGenConfig = JSON.parse(fs.readFileSync(gqlGenConfigPath, 'utf-8'));

// Type conversion map
const gqlToTsTypeMap: { [key: string]: string } = {
    ...gqlGenConfig.primitives,
    // Add any additional mappings here
};

function convertGqlTypeToTs(gqlType: string): string {
    return gqlToTsTypeMap[gqlType] || gqlType;
}

// Register Handlebars helpers
Handlebars.registerHelper('convertGqlTypeToTs', (gqlType: string) => convertGqlTypeToTs(gqlType));

Handlebars.registerHelper('toLowerCase', (text: string) => {
    if (typeof text !== 'string') {
        return text;
    }
    return text.toLowerCase();
});

Handlebars.registerHelper('convertType', (gqlType: string) => convertGqlTypeToTs(gqlType));

Handlebars.registerHelper('columnOptions', (gqfield: { type: string }) => {
    let options = `type: ${getTypeORMType(gqfield.type)}`;
    return options;
});

function getTypeORMType(gqlType: string): string {
    switch (gqlType) {
        case 'String':
            return '"varchar", length: 255';
        case 'Int':
            return '"int"';
        // Add more cases as needed
        default:
            return '"varchar", length: 255';
    }
}

Handlebars.registerHelper('typeORMType', (gqlType: string) => {
    const gqlToMongooseTypeMap: { [key: string]: string } = {
        String: 'string',
        Int: 'number',
        Float: 'number',
        Boolean: 'boolean',
        ID: 'string',
        // Add more mappings if needed
    };
    return gqlToMongooseTypeMap[gqlType] || 'String';
});

Handlebars.registerHelper('mongooseType', (gqlType: string) => {
    const gqlToMongooseTypeMap: { [key: string]: string } = {
        String: 'String',
        Int: 'Number',
        Float: 'Number',
        Boolean: 'Boolean',
        ID: 'String',
        // Add more mappings if needed
    };

    if (gqlType.endsWith('[]')) {
        const baseType = gqlType.slice(0, -2);
        return `[${gqlToMongooseTypeMap[baseType] || 'String'}]`;
    }

    return gqlToMongooseTypeMap[gqlType] || 'String';
});


Handlebars.registerHelper('ifDirective', function (this: any, context: any, directiveName: string, options: Handlebars.HelperOptions) {
    if (context.directives && context.directives.some((d: any) => d.name === directiveName)) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('formatDefaultValue', function(defaultValue) {
    if (typeof defaultValue === 'string') {
        return new Handlebars.SafeString(`"${defaultValue}"`);
    }
    return defaultValue;  // Return as is for other types
});


// Function to create executable schema
export function createExecutableSchema(typeDefs: string): GraphQLSchema {
    return makeExecutableSchema({
        typeDefs: gql(typeDefs),
        allowUndefinedInResolve: true,
    });
}

export { Handlebars };
