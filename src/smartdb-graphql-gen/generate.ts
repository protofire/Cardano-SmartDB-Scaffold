import { EntityAnswers, FieldAnswers, TypeSelection } from './types';

function determineFieldType(fieldInfo: TypeSelection): {
    fieldType: string;
    specialTypeName?: string;
} {
    // console.log("fieldInfo ",fieldInfo.typeCategory)
    if (fieldInfo.typeCategory === 'Normal') {
        return { fieldType: fieldInfo.type as string };
    } else {
        switch (fieldInfo.type) {
            case 'From Lucid Cardano':
                return { fieldType: 'String', specialTypeName: fieldInfo.lucidType };
            case 'From Smart DB':
                return { fieldType: 'String', specialTypeName: fieldInfo.smartDbType };
            case 'Custom':
                return { fieldType: 'String', specialTypeName: fieldInfo.customType };
            default:
                return { fieldType: 'Unknown' };
        }
    }
}

function getFullTypeName(fieldInfo: TypeSelection): string {
    const { specialTypeName } = determineFieldType(fieldInfo);
    if (!specialTypeName) return '';

    if (fieldInfo.subtype) {
        const subTypeInfo = determineFieldType(fieldInfo.subtype);
        return `${specialTypeName}<${subTypeInfo.specialTypeName || subTypeInfo.fieldType}>`;
    }

    return specialTypeName;
}

export function generateEntitySchema(entityAnswers: EntityAnswers, fields: FieldAnswers[]): string {
    const smartDbImports = new Set<string>();
    const lucidCardanoImports = new Set<string>();
    const customImports = new Set<{ type: string; from: string }>();

    let schema = `type ${entityAnswers.entityName}`;

    if (entityAnswers.entityType === 'entity') {
        schema += ' @entity';
    } else if (entityAnswers.entityType === 'smartDBEntity' && entityAnswers.smartDBParams) {
        const params = entityAnswers.smartDBParams;
        schema +=
            ` @smartDBEntity(` +
            `plutusDataIsSubType: ${params.plutusDataIsSubType}, ` +
            (params.plutusDataIsSubType ? `plutusDataIndex: ${params.plutusDataIndex}, ` : '') +
            `isNETIdUnique: ${params.isNETIdUnique}, ` +
            `tokenName: "${params.tokenName || entityAnswers.entityName + 'ID'}")`;
    }

    // Add index information
    if (entityAnswers.hasIndexes && entityAnswers.indexes && entityAnswers.indexes.length > 0) {
        const indexArray = entityAnswers.indexes.map((idx) => `"${idx.trim()}"`);
        schema += ` @index(indexName:[${indexArray.join(', ')}])`;
    }

    schema += ' {\n';

    // Helper function to recursively collect imports from type and its subtypes
    function collectImportsFromType(typeSelection: TypeSelection) {
        if (typeSelection.type === 'From Lucid Cardano' && typeSelection.lucidType) {
            lucidCardanoImports.add(typeSelection.lucidType);
        } else if (typeSelection.type === 'From Smart DB' && typeSelection.smartDbType) {
            smartDbImports.add(typeSelection.smartDbType);
            // If it's a Maybe or MinMaxDef, check its subtype
            if ((typeSelection.smartDbType === 'Maybe' || typeSelection.smartDbType === 'MinMaxDef') && typeSelection.subtype) {
                collectImportsFromType(typeSelection.subtype);
            }
        } else if (typeSelection.type === 'Custom' && typeSelection.customType && typeSelection.customTypeImport) {
            customImports.add({
                type: typeSelection.customType,
                from: typeSelection.customTypeImport,
            });
        }
    }

    for (const field of fields) {
        const { fieldType, specialTypeName } = determineFieldType(field);

        // console.log(fieldType)
        // console.log(specialTypeName)
        schema += ` ${field.name}: ${fieldType}`;

        if (field.isNullable) {
            schema += ' @nullable';
        }

        if (specialTypeName) {
            const fullTypeName = getFullTypeName(field);
            schema += ` @specialType(typeName:"${fullTypeName}")`;

            // Collect imports from field and its subtypes
            collectImportsFromType(field);
        }

        if (field.isDatumField) {
            schema += ` @convertible(params:["isForDatum: true"])`;
        }

        if (field.defaultValue) {
            schema += ` @default(defaultValue:"${field.defaultValue}")`;
        }

        schema += '\n';
    }

    // console.log(schema)
    schema += '}\n';

    // Add import directive
    if (smartDbImports.size > 0 || lucidCardanoImports.size > 0 || customImports.size > 0) {
        let importDirective = ' @specialImports(';
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
    // console.log('entities: '+JSON.stringify(entities, null, 2));

    let schema = `
directive @entity on OBJECT
directive @smartDBEntity(plutusDataIsSubType: Boolean!, plutusDataIndex: Int, isNETIdUnique: Boolean!, tokenName: String!) on OBJECT
directive @specialImports(fromSmart_db: [String], fromLucid_cardano: [String], rawImport: String) on OBJECT
directive @index(indexName:[String]) on OBJECT
directive @nullable on FIELD
directive @specialType(typeName:String!) on FIELD
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
