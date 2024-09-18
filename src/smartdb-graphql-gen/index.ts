import { Command } from 'commander';
import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { parse, DocumentNode, ObjectTypeDefinitionNode } from 'graphql';
import * as glob from 'glob';
import { basicTypes, EntityAnswers, FieldAnswers, lucidCardanoTypes, smartDbTypes, SpecialTypeSource, TypeSelection, typesWithSubtypes } from './types';

import { flattenGraphQLAST } from '../utils/helpers';
import { generateMasterSchema } from './generate';

const program = new Command();

program
    .version('1.0.0')
    .option('-o, --output <path>', 'output file path for the generated GraphQL schema')
    .action(async (options) => {
        console.log(chalk.blue.bold('🚀 Welcome to the Comprehensive SmartDB - GraphQL Schema Generator! 🚀'));

        let outputFile = options.output;
        let existingSchema: DocumentNode | null = null;

        if (!outputFile) {
            const graphqlFiles = glob.sync('**/*.graphql', { cwd: process.cwd() });
            const fileChoices = graphqlFiles.map(file => ({ name: file, value: file }));
            fileChoices.push({ name: 'Create new file', value: 'new' });

            const { selectedFile } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedFile',
                    message: 'Select a GraphQL schema file or create a new one:',
                    choices: fileChoices
                }
            ]);

            if (selectedFile === 'new') {
                const { newFilePath } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'newFilePath',
                        message: 'Enter the path for the new GraphQL schema file:',
                        default: 'schema.graphql'
                    }
                ]);
                outputFile = newFilePath;
            } else {
                outputFile = selectedFile;
                let schemaContent: string;    
                try {
                    schemaContent = await fs.readFile(outputFile, 'utf-8');
                    console.log(chalk.green('✅ Successfully read schema file'));
                } catch (error) {
                    console.error(chalk.red(`❌ Error reading schema file: ${error}`));
                    return;
                }   
                
                try {
                    existingSchema = parse(schemaContent);
                    console.log(chalk.green('✅ Successfully parsed schema'));
                } catch (error) {
                    console.error(chalk.red(`❌ Error parsing schema: ${error}`));
                    return;
                }
                
            }
        }

        console.log(chalk.green(`📄 Using GraphQL schema file: ${outputFile}`));

        let entities: EntityAnswers[] = [];

        if (existingSchema) {
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do with the existing schema?',
                    choices: ['Update', 'Overwrite completely', 'Cancel']
                }
            ]);

            if (action === 'Cancel') {
                console.log(chalk.yellow('Operation cancelled.'));
                return;
            }

            if (action === 'Update') {
                entities = extractEntitiesFromSchema(existingSchema);
            }
        }

        let continueEditing = true;

        while (continueEditing) {
            if (entities.length > 0) {
                const { entityAction } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'entityAction',
                        message: 'What would you like to do?',
                        choices: ['Update existing entity', 'Add new entity', 'Finish editing']
                    }
                ]);

                if (entityAction === 'Update existing entity') {
                    await updateExistingEntity(entities);
                } else if (entityAction === 'Add new entity') {
                    const newEntity = await createNewEntity();
                    entities.push(newEntity);
                } else {
                    continueEditing = false;
                }
            } else {
                const newEntity = await createNewEntity();
                entities.push(newEntity);

                const { addMore } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'addMore',
                        message: 'Do you want to add another entity?',
                        default: true
                    }
                ]);

                continueEditing = addMore;
            }
        }

        console.log(chalk.blue('🔧 Generating GraphQL schema...'));
        const schemaContent = generateMasterSchema(entities);

        // Write schema to output file
        try {
            await fs.writeFile(path.resolve(outputFile), schemaContent);
            console.log(chalk.green.bold(`✅ Schema successfully written to ${chalk.underline(outputFile)}`));
        } catch (error) {
            console.error(chalk.red(`❌ Error writing schema to file: ${error}`));
        }

        console.log(chalk.blue.bold('🎉 GraphQL schema generation complete! 🎉'));
    });

program.parse(process.argv);

function extractEntitiesFromSchema(schema: DocumentNode): EntityAnswers[] {
    const entityTypes = schema.definitions.filter(
        def => def.kind === 'ObjectTypeDefinition' && 
               (def.directives?.some(d => d.name.value === 'entity') ||
                def.directives?.some(d => d.name.value === 'smartDBEntity'))
    ) as ObjectTypeDefinitionNode[];

    return entityTypes.map(entity => {
        const flattenedEntity = flattenGraphQLAST(entity);
        // console.log(JSON.stringify(flattenedEntity, null, 2));

        return {
            entityName: flattenedEntity.name,
            entityType: flattenedEntity.directives.find((d: { name: string; }) => d.name === 'entity' || d.name === 'smartDBEntity')?.name as 'entity' | 'smartDBEntity',
            fields: flattenedEntity.fields.map((field: { name: any; type: any; nullable: any; directives: any[]; }) => ({
                name: field.name,
                ...field.type,
                isNullable: field.nullable,
                isDatumField: field.directives.some(d => {
                    if (d.name !== 'convertible') return false;
                    if (!Array.isArray(d.args)) return false;
                    return d.args.some((arg: { name: string; value: string | string[]; }) => 
                        arg.name === 'params' && 
                        (typeof arg.value === 'string' ? arg.value.includes('isForDatum: true') : arg.value.includes('isForDatum: true'))
                    );
                }),
                addAnotherField: false
            })),
            hasIndexes: flattenedEntity.directives.some((d: { name: string; }) => d.name === 'index'),
            indexes: (() => {
                const indexDirective = flattenedEntity.directives.find((d: { name: string; }) => d.name === 'index');
                if (!indexDirective || !Array.isArray(indexDirective.args)) return [];
                const indexNameArg = indexDirective.args.find((arg: { name: string; }) => arg.name === 'indexName');
                return indexNameArg && Array.isArray(indexNameArg.value) ? indexNameArg.value : [];
            })()
        };
    });
}

async function updateExistingEntity(entities: EntityAnswers[]): Promise<void> {
    const { entityToUpdate } = await inquirer.prompt([
        {
            type: 'list',
            name: 'entityToUpdate',
            message: 'Which entity would you like to update?',
            choices: entities.map(e => e.entityName)
        }
    ]);

    const entityIndex = entities.findIndex(e => e.entityName === entityToUpdate);
    const entity = entities[entityIndex];

    console.log(chalk.yellow(`Updating entity: ${entityToUpdate}`));

    const updatedFields: FieldAnswers[] = [];

    for (const field of entity.fields) {
        const updatedField = await updateField(field, entity.entityType);
        updatedFields.push(updatedField);
    }

    const { addMoreFields } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'addMoreFields',
            message: 'Do you want to add more fields to this entity?',
            default: false
        }
    ]);

    if (addMoreFields) {
        let addAnotherField = true;
        while (addAnotherField) {
            const newField = await createNewField(entity.entityType);
            updatedFields.push(newField);
            addAnotherField = newField.addAnotherField;
        }
    }

    const { updateIndexes } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'updateIndexes',
            message: 'Do you want to update the indexes for this entity?',
            default: false
        }
    ]);

    let indexes = entity.indexes || [];

    if (updateIndexes) {
        const { newIndexes } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'newIndexes',
                message: 'Select fields to index:',
                choices: updatedFields.map(field => field.name),
                default: indexes
            }
        ]);
        indexes = newIndexes;
    }

    entities[entityIndex] = {
        ...entity,
        fields: updatedFields,
        hasIndexes: indexes.length > 0,
        indexes
    };

    console.log(chalk.green(`✅ Entity "${entityToUpdate}" updated successfully`));
}

async function createNewEntity(): Promise<EntityAnswers> {
    console.log(chalk.yellow('Creating a new entity...'));

    const entityQuestions: inquirer.QuestionCollection = [
        {
            type: 'input',
            name: 'entityName',
            message: 'What is the name of your entity?',
            validate: (input: string) => input.trim() !== '' || 'Entity name cannot be empty',
        },
        {
            type: 'list',
            name: 'entityType',
            message: 'What type of entity is this?',
            choices: ['entity', 'smartDBEntity'],
        },
    ];

    const entityAnswers = await inquirer.prompt(entityQuestions);
    const fields: FieldAnswers[] = [];
    let addAnotherField = true;

    while (addAnotherField) {
        const fieldAnswers = await createNewField(entityAnswers.entityType);
        fields.push(fieldAnswers);
        addAnotherField = fieldAnswers.addAnotherField;
    }

    const { hasIndexes, indexes } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'hasIndexes',
            message: 'Do you want to add indexes?',
            default: false,
        },
        {
            type: 'checkbox',
            name: 'indexes',
            message: 'Select fields to index:',
            choices: fields.map((field) => field.name),
            when: (answers: any) => answers.hasIndexes,
        },
    ]);

    return {
        entityName: entityAnswers.entityName,
        entityType: entityAnswers.entityType,
        fields,
        hasIndexes,
        indexes,
    };
}

async function createNewField(entityType: string): Promise<FieldAnswers> {
    console.log(chalk.yellow('Adding a new field...'));

    const nameQuestion: inquirer.QuestionCollection = [
        {
            type: 'input',
            name: 'name',
            message: 'Enter field name:',
            validate: (input: string) => input.trim() !== '' || 'Field name cannot be empty',
        },
    ];

    const { name } = await inquirer.prompt(nameQuestion);

    const typeSelection = await getTypeSelection();

    const additionalQuestions: inquirer.QuestionCollection = [
        {
            type: 'confirm',
            name: 'isNullable',
            message: 'Is this field nullable?',
            default: false,
        },
        {
            type: 'confirm',
            name: 'isDatumField',
            message: 'Is this a datum field?',
            default: false,
            when: () => entityType === 'smartDBEntity',
        },
        {
            type: 'confirm',
            name: 'setDefault',
            message: 'Do you want to set a default value for this field?',
            default: false,
        },
        {
            type: 'input',
            name: 'defaultValue',
            message: 'Enter the default value:',
            when: (answers: any) => answers.setDefault,
        },
        {
            type: 'confirm',
            name: 'addAnotherField',
            message: 'Do you want to add another field?',
            default: true,
        },
    ];

    const additionalAnswers = await inquirer.prompt(additionalQuestions);

    return {
        name,
        ...typeSelection,
        isNullable: additionalAnswers.isNullable,
        isDatumField: additionalAnswers.isDatumField || false,
        setDefault: additionalAnswers.setDefault,
        defaultValue: additionalAnswers.defaultValue,
        addAnotherField: additionalAnswers.addAnotherField,
    } as FieldAnswers;
}

async function updateField(field: FieldAnswers, entityType: string): Promise<FieldAnswers> {
    console.log(chalk.yellow(`Updating field: ${field.name}`));

    const updatedField = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Field name:',
            default: field.name
        },
        {
            type: 'confirm',
            name: 'updateType',
            message: 'Do you want to update the field type?',
            default: false
        }
    ]);

    let typeSelection: TypeSelection = field;
    if (updatedField.updateType) {
        typeSelection = await getTypeSelection(undefined, field);
    }

    const additionalQuestions: inquirer.QuestionCollection = [
        {
            type: 'confirm',
            name: 'isNullable',
            message: 'Is this field nullable?',
            default: field.isNullable
        },
        {
            type: 'confirm',
            name: 'isDatumField',
            message: 'Is this a datum field?',
            default: field.isDatumField,
            when: () => entityType === 'smartDBEntity'
        },
        {
            type: 'confirm',
            name: 'setDefault',
            message: 'Do you want to set a default value for this field?',
            default: field.setDefault
        },
        {
            type: 'input',
            name: 'defaultValue',
            message: 'Enter the default value:',
            when: (answers: any) => answers.setDefault,
            default: field.defaultValue
        }
    ];

    const additionalAnswers = await inquirer.prompt(additionalQuestions);

    return {
        ...field,
        ...updatedField,
        ...typeSelection,
        ...additionalAnswers,
        addAnotherField: false
    };
}

async function getTypeSelection(parentType?: string, defaultValues?:FieldAnswers): Promise<TypeSelection> {
    const typeQuestions: inquirer.QuestionCollection<TypeSelection> = [
        {
            type: 'list',
            name: 'typeCategory',
            message: parentType ? `Choose the subtype category for ${parentType}:` : 'Choose field type category:',
            choices: ['Normal', 'Special'],
            default: defaultValues?.typeCategory || 'Normal',
        },
        {
            type: 'list',
            name: 'type',
            message: parentType ? `Choose the subtype for ${parentType}:` : 'Choose field type:',
            choices: (answers: TypeSelection) => (answers.typeCategory === 'Normal' ? basicTypes : (['From Lucid Cardano', 'From Smart DB', 'Custom'] as SpecialTypeSource[])),
            default: defaultValues?.type || basicTypes[0],
        },
        {
            type: 'list',
            name: 'lucidType',
            message: 'Choose Lucid Cardano type:',
            choices: lucidCardanoTypes,
            when: (answers: TypeSelection) => answers.type === 'From Lucid Cardano',
            default: defaultValues?.lucidType || lucidCardanoTypes[0],
        },
        {
            type: 'list',
            name: 'smartDbType',
            message: 'Choose Smart DB type:',
            choices: smartDbTypes,
            when: (answers: TypeSelection) => answers.type === 'From Smart DB',
            default: defaultValues?.smartDbType || smartDbTypes[0],
        },
        {
            type: 'input',
            name: 'customType',
            message: 'Enter custom type:',
            when: (answers: TypeSelection) => answers.type === 'Custom',
            default: defaultValues?.customType || 'Enter Type',
            validate: (input: string) => input.trim() !== '' || 'Custom type cannot be empty',
        },
        {
            type: 'input',
            name: 'customTypeImport',
            message: 'Enter where to import the custom type from:',
            when: (answers: TypeSelection) => answers.type === 'Custom',
            default: defaultValues?.customTypeImport || 'Enter Import Path',
            validate: (input: string) => input.trim() !== '' || 'Custom type import path cannot be empty',
        },
    ];

    const typeAnswers = await inquirer.prompt<TypeSelection>(typeQuestions);

    if (typesWithSubtypes.includes(typeAnswers.smartDbType as any)) {
        typeAnswers.subtype = await getTypeSelection(typeAnswers.smartDbType);
    }

    return typeAnswers;
}
