import { EntityAnswers, FieldAnswers, TypeSelection } from './types';

// function determineFieldType(fieldInfo: TypeSelection): {
//     fieldType: string;
//     especialTypeName?: string;
// } {
// console.log("fieldInfo ",fieldInfo)
//     if (fieldInfo.typeCategory === 'Normal') {
//         return { fieldType: fieldInfo.type as string };
//     } else {
//         switch (fieldInfo.type) {
//             case 'From Lucid Cardano':
//                 return { fieldType: 'String', especialTypeName: fieldInfo.lucidType };
//             case 'From Smart DB':
//                 return { fieldType: 'String', especialTypeName: fieldInfo.smartDbType };
//             case 'Custom':
//                 return { fieldType: 'String', especialTypeName: fieldInfo.customType };
//             default:
//                 return { fieldType: 'Unknown' };
//         }
//     }
// }

function determineFieldType(fieldInfo: TypeSelection): {
    fieldType: string;
    especialTypeName?: string;
} {
    // console.log("fieldInfo ",fieldInfo.typeCategory)
    if (fieldInfo.typeCategory === 'Normal') {
        return { fieldType: fieldInfo.type as string };
    } else {
        switch (fieldInfo.type) {
            case 'From Lucid Cardano':
                return { fieldType: 'String', especialTypeName: fieldInfo.lucidType };
            case 'From Smart DB':
                return { fieldType: 'String', especialTypeName: fieldInfo.smartDbType };
            case 'Custom':
                return { fieldType: 'String', especialTypeName: fieldInfo.customType };
            default:
                return { fieldType: 'Unknown' };
        }
    }
}

function getFullTypeName(fieldInfo: TypeSelection): string {
    const { especialTypeName } = determineFieldType(fieldInfo);
    if (!especialTypeName) return '';

    if (fieldInfo.subtype) {
        const subTypeInfo = determineFieldType(fieldInfo.subtype);
        return `${especialTypeName}<${subTypeInfo.especialTypeName || subTypeInfo.fieldType}>`;
    }

    return especialTypeName;
}

export function generateEntitySchema(entityAnswers: EntityAnswers, fields: FieldAnswers[]): string {
    let schema = `type ${entityAnswers.entityName} @${entityAnswers.entityType}`;

    const smartDbImports = new Set<string>();
    const lucidCardanoImports = new Set<string>();
    const customImports = new Set<{ type: string; from: string }>();

    // Add index information
    if (entityAnswers.hasIndexes && entityAnswers.indexes && entityAnswers.indexes.length > 0) {
        const indexArray = entityAnswers.indexes.map((idx) => `"${idx.trim()}"`);
        schema += ` @index(indexName:[${indexArray.join(', ')}])`;
    }

    schema += ' {\n';

    for (const field of fields) {
        const { fieldType, especialTypeName } = determineFieldType(field);

        // console.log(fieldType)
        // console.log(especialTypeName)
        schema += `    ${field.name}: ${fieldType}`;

        if (field.isNullable) {
            schema += ' @nullable';
        }

        if (especialTypeName) {
            const fullTypeName = getFullTypeName(field);
            schema += ` @especialType(typeName:"${fullTypeName}")`;

            // Add imports
            if (field.type === 'From Lucid Cardano') {
                lucidCardanoImports.add(`type ${especialTypeName}`);
            } else if (field.type === 'From Smart DB') {
                smartDbImports.add(`type ${especialTypeName}`);
            } else if (field.type === 'Custom' && field.customTypeImport) {
                if (field.customTypeImport.length != 0) {
                    customImports.add({
                        type: especialTypeName,
                        from: field.customTypeImport,
                    });
                }
            }
        }

        if (field.isDatumField) {
            schema += ` @convertible(params:["isForDatum: true"])`;
        }

        if (field.defaultValue) {
            schema += `  @default(defaultValue:"${field.defaultValue}")`;
        }

        schema += '\n';
    }

    // console.log(schema)
    schema += '}\n';

    // Add import directive
    if (smartDbImports.size > 0 || lucidCardanoImports.size > 0 || customImports.size > 0) {
        let importDirective = ' @especialImports(';
        if (smartDbImports.size > 0) {
            importDirective += `fromSmart_db:[${Array.from(smartDbImports)
                .map((type) => `"${type}"`)
                .join(', ')}]`;
        }
        if (lucidCardanoImports.size > 0) {
            importDirective += `${smartDbImports.size > 0 ? ', ' : ''}fromLucid_cardano:[${Array.from(lucidCardanoImports)
                .map((type) => `"${type}"`)
                .join(', ')}]`;
        }
        if (customImports.size > 0) {
            importDirective += `${smartDbImports.size > 0 || lucidCardanoImports.size > 0 ? ', ' : ''}rawImport:"${Array.from(customImports)
                .map(({ type, from }) => `import { ${type} } from '${from}'`)
                .join('; ')}"`;
        }
        importDirective += ')';

        const entityDeclarationEndIndex = schema.indexOf('{');
        schema = schema.slice(0, entityDeclarationEndIndex) + importDirective + schema.slice(entityDeclarationEndIndex);
    }

    return schema;
}

export function generateMasterSchema(entities: EntityAnswers[]): string {
    console.log(JSON.stringify(entities, null, 2));

    let schema = `
directive @entity on OBJECT
directive @smartDBEntity on OBJECT
directive @especialImports(fromSmart_db: [String], fromLucid_cardano: [String], rawImport: String) on OBJECT
directive @index(indexName:[String]) on OBJECT
directive @nullable on FIELD
directive @especialType(typeName:String!) on FIELD
directive @default(defaultValue:String!) on FIELD
directive @convertible(params: [String]) on FIELD

`;

    for (const entity of entities) {
        schema += generateEntitySchema(entity, entity.fields) + '\n';
    }

    schema += `
type Query @resolvers {
    not_used: String
}

schema {
    query: Query
}
`;

    return schema;
}
