import { ObjectTypeDefinitionNode } from "graphql";

export function flattenGraphQL(node: ObjectTypeDefinitionNode): any {
    const flattenedType: any = {
        name: node.name.value,
        fields: [],
        directives: [],
    };

    // Process fields
    if (node.fields) {
        flattenedType.fields = node.fields.map(field => {
            const flattenedField: any = {
                name: field.name.value,
                type: getTypeName(field.type),
                directives: field.directives?.map(flattenDirective) || []
            };

            // Extract directive values to field level
            field.directives?.forEach((directive: any) => {
                Object.assign(flattenedField, flattenDirectiveArgs(directive));
            });

            return flattenedField;
        });
    }

    // Process directives
    if (node.directives) {
        flattenedType.directives = node.directives.map(flattenDirective);

        // Find smartDBEntity directive
        const smartDBDirective = node.directives.find(d => d.name.value === 'smartDBEntity');
        if (smartDBDirective) {
            flattenedType.entityType = 'smartDBEntity';
            const args = flattenDirectiveArgs(smartDBDirective);
            flattenedType.smartDBParams = {
                plutusDataIsSubType: args.plutusDataIsSubType ?? false,
                plutusDataIndex: args.plutusDataIndex ?? 0,
                isNETIdUnique: args.isNETIdUnique ?? false,
                tokenName: args.tokenName ?? `${node.name.value}ID`
            };
        } else if (node.directives.some(d => d.name.value === 'entity')) {
            flattenedType.entityType = 'entity';
        }
        
        // Extract directive values to entity level
        node.directives.forEach(directive => {
            Object.assign(flattenedType, flattenDirectiveArgs(directive));
        });
    }

    return flattenedType;
}

function flattenDirective(directive: any): any {
    return {
        name: directive.name.value,
        args: flattenDirectiveArgs(directive)
    };
}

function flattenDirectiveArgs(directive: any): any {
    const flattenedArgs: any = {};
    if (directive.arguments) {
        directive.arguments.forEach((arg: any) => {
            flattenedArgs[arg.name.value] = getArgumentValue(arg.value);
        });
    }
    return flattenedArgs;
}

function getTypeName(type: any): string {
    if (type.kind === 'NamedType') {
        return type.name.value;
    } else if (type.kind === 'ListType') {
        return `[${getTypeName(type.type)}]`;
    } else if (type.kind === 'NonNullType') {
        return `${getTypeName(type.type)}!`;
    }
    return 'Unknown';
}

function getArgumentValue(value: any): any {
    switch (value.kind) {
        case 'StringValue':
            return value.value;
        case 'IntValue':
        case 'FloatValue':
            return Number(value.value);
        case 'BooleanValue':
            return value.value;
        case 'ListValue':
            return value.values.map(getArgumentValue); // Preserve original list structure
        case 'ObjectValue':
            return value.fields.reduce((acc: any, field: any) => {
                acc[field.name.value] = getArgumentValue(field.value);
                return acc;
            }, {});
        default:
            return null;
    }
}
