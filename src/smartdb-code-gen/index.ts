import { Command } from 'commander';
import * as inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { parse, DocumentNode, ObjectTypeDefinitionNode } from 'graphql';
import { Handlebars, createExecutableSchema } from './handlebars-helpers';
import { flattenGraphQLAST } from '../utils/helpers';
import * as glob from 'glob';
import chalk from 'chalk';

const program = new Command();

program
    .version('1.0.0')
    .option('-i, --input <path>', 'input GraphQL schema file')
    .action(async (options) => {
        console.log(chalk.blue.bold('🚀 Welcome to the SmartDB Code Generator! 🚀'));

        let inputFile = options.input;
        let schemaContent: string;

        if (!inputFile) {
            const graphqlFiles = glob.sync('**/*.graphql', { cwd: process.cwd() });
            if (graphqlFiles.length > 0) {
                const fileChoices = graphqlFiles.map(file => ({ name: file, value: file }));
                const { selectedFile } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'selectedFile',
                        message: 'Select a GraphQL schema file:',
                        choices: [...fileChoices, { name: 'Enter custom path', value: 'custom' }]
                    }
                ]);

                if (selectedFile === 'custom') {
                    const { customPath } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'customPath',
                            message: 'Enter the path to your GraphQL schema file:',
                            validate: (input: string) => input.trim() !== '' || 'File path cannot be empty'
                        }
                    ]);
                    inputFile = customPath;
                } else {
                    inputFile = selectedFile;
                }
            } else {
                const { customPath } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'customPath',
                        message: 'No GraphQL files found. Enter the path to your GraphQL schema file:',
                        validate: (input: string) => input.trim() !== '' || 'File path cannot be empty'
                    }
                ]);
                inputFile = customPath;
            }
        }

        console.log(chalk.green(`📄 Using GraphQL schema file: ${inputFile}`));

        try {
            schemaContent = await fs.readFile(inputFile, 'utf-8');
            console.log(chalk.green('✅ Successfully read schema file'));
        } catch (error) {
            console.error(chalk.red(`❌ Error reading schema file: ${error}`));
            return;
        }

        let parsedSchema: DocumentNode;
        let executableSchema: any;
        try {
            parsedSchema = parse(schemaContent);
            console.log(chalk.green('✅ Successfully parsed schema'));
            executableSchema = createExecutableSchema(schemaContent);
            console.log(chalk.green('✅ Successfully created executable schema'));
        } catch (error) {
            console.error(chalk.red(`❌ Error parsing schema or creating executable schema: ${error}`));
            return;
        }

        // Extract entity types from the schema
        const entityTypes = parsedSchema.definitions.filter(
            def => def.kind === 'ObjectTypeDefinition' && 
                   (def.directives?.some(d => d.name.value === 'entity') ||
                    def.directives?.some(d => d.name.value === 'smartDBEntity'))
        ) as ObjectTypeDefinitionNode[];

        if (entityTypes.length === 0) {
            console.log(chalk.yellow('⚠️ No entity types found in the schema.'));
            return;
        }

        const entityChoices = entityTypes.map(type => ({
            name: type.name.value,
            value: type.name.value
        }));

        const { selectedEntity, filesToGenerate } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedEntity',
                message: 'Select the entity you want to generate files for:',
                choices: entityChoices,
            },
            {
                type: 'checkbox',
                name: 'filesToGenerate',
                message: 'Select the files you want to generate:',
                choices: [
                    { name: 'Entity', value: 'entity' },
                    { name: 'Entity Mongo', value: 'entityMongo' },
                    { name: 'Entity PostgreSQL', value: 'entityPostgreSQL' },
                    { name: 'Backend', value: 'backend' },
                    { name: 'Frontend', value: 'frontend' },
                    { name: 'View', value: 'view' },
                    { name: 'Component', value: 'component' },
                ],
                validate: (answer: string[]) => answer.length > 0 || 'You must choose at least one file type to generate'
            }
        ]);

        const selectedEntityNode = entityTypes.find(type => type.name.value === selectedEntity);
        if (!selectedEntityNode) {
            console.error(chalk.red('❌ Selected entity not found in schema'));
            return;
        }

        // Ask for output directory
        const { outputDir } = await inquirer.prompt([
            {
                type: 'input',
                name: 'outputDir',
                message: 'Enter the path to your src folder:',
                default: './src',
                validate: (input: string) => input.trim() !== '' || 'Output directory cannot be empty'
            }
        ]);

        console.log(chalk.green(`📁 Output directory set to: ${outputDir}`));

        const requiredFolders = [
            'lib/SmartDB/Entities',
            'lib/SmartDB/BackEnd',
            'lib/SmartDB/FrontEnd',
            'components/public',
            'pages'
        ];

        const missingFolders = requiredFolders.filter(folder => !fs.existsSync(path.join(outputDir, folder)));

        if (missingFolders.length > 0) {
            console.log(chalk.yellow('⚠️ The following folders will be created:'));
            missingFolders.forEach(folder => console.log(chalk.yellow(`  - ${folder}`)));
            const { createFolders } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'createFolders',
                    message: 'Do you want to create these folders?',
                    default: true
                }
            ]);

            if (createFolders) {
                missingFolders.forEach(folder => {
                    fs.mkdirpSync(path.join(outputDir, folder));
                    console.log(chalk.green(`✅ Created folder: ${folder}`));
                });
            } else {
                console.log(chalk.yellow('⚠️ Please create the required folders manually or use the Cardano-SmartDB-Template.'));
                console.log(chalk.blue('🔗 You can fork the template from: https://github.com/protofire/Cardano-SmartDB-Template'));
                return;
            }
        }

        for (const fileType of filesToGenerate) {
            await generateFile(fileType, selectedEntityNode, executableSchema, outputDir);
        }

        // Update configuration files
        const { updateConfig } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'updateConfig',
                message: 'Do you want to update the configuration files?',
                default: true
            }
        ]);

        if (updateConfig) {
            await updateConfigurationFiles(selectedEntity, filesToGenerate, outputDir);
        }

        console.log(chalk.green.bold('✨ Code generation complete! ✨'));
    });

program.parse(process.argv);

async function generateFile(fileType: string, entity: ObjectTypeDefinitionNode, executableSchema: any, outputDir: string) {
    console.log(chalk.blue(`📝 Generating ${fileType} file for entity ${entity.name.value}`));
    const templatePath = path.resolve(__dirname, 'code-templates', `${getTemplateName(fileType)}`);

    let template: string;
    try {
        template = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
        console.error(chalk.red(`❌ Error reading template for ${fileType}: ${error}`));
        return;
    }

    const compiledTemplate = Handlebars.compile(template);
    
    const flattenedEntity = flattenGraphQLAST(entity);
    // console.log(JSON.stringify(flattenedEntity, null, 2));
    
    const output = compiledTemplate(flattenedEntity);
    // console.log(JSON.stringify(output, null, 2));

    const outputPath = path.join(outputDir, getOutputPath(fileType, entity.name.value));
    try {
        await fs.outputFile(outputPath, output);
        console.log(chalk.green(`✅ Successfully wrote ${fileType} file to ${outputPath}`));
        if (fileType === 'component') {
            const scssPath = path.join(path.dirname(outputPath), `${entity.name.value}.module.scss`);
            await fs.outputFile(scssPath, '/* Add your styles here */');
            console.log(chalk.green(`✅ Created SCSS file at ${scssPath}`));
        }
    } catch (error) {
        console.error(chalk.red(`❌ Error writing ${fileType} file: ${error}`));
    }
}

function getTemplateName(fileType: string): string {
    switch (fileType) {
        case 'entity':
            return 'Entity.ts.type.handlebars';
        case 'entityMongo':
            return 'Entity.Mongo.ts.type.handlebars';
        case 'entityPostgreSQL':
            return 'Entity.PostgreSQL.ts.type.handlebars';
        case 'backend':
            return 'BackEnd.ts.type.handlebars';
        case 'frontend':
            return 'FrontEnd.ts.type.handlebars';
        case 'component':
            return 'components.ts.type.handlebars';
        case 'view':
            return 'page.ts.type.handlebars';
        default:
            throw new Error(`Unknown file type: ${fileType}`);
    }
}

function getOutputPath(fileType: string, entityName: string): string {
    switch (fileType) {
        case 'entity':
        case 'entityMongo':
        case 'entityPostgreSQL':
            return `lib/SmartDB/Entities/${entityName}.Entity${fileType === 'entity' ? '' : '.' + fileType.replace('entity', '')}.ts`;
        case 'backend':
            return `lib/SmartDB/BackEnd/${entityName}.BackEnd.Api.Handlers.ts`;
        case 'frontend':
            return `lib/SmartDB/FrontEnd/${entityName}.FrontEnd.Api.Calls.ts`;
        case 'component':
            return `components/public/${entityName}/${entityName}.tsx`;
        case 'view':
            return `pages/${entityName.toLowerCase()}.tsx`;
        default:
            throw new Error(`Unknown file type: ${fileType}`);
    }
}


async function updateConfigurationFiles(entityName: string, generatedFiles: string[], outputDir: string) {
    const configFiles = [
        {
            path: 'lib/SmartDB/BackEnd/index.ts',
            content: `export * from './${entityName}.BackEnd.Api.Handlers';`,
            condition: generatedFiles.includes('backend')
        },
        {
            path: 'lib/SmartDB/Entities/index.ts',
            content: `export * from './${entityName}.Entity';`,
            condition: generatedFiles.includes('entity')
        },
        {
            path: 'lib/SmartDB/Entities/index.BackEnd.ts',
            content: [
                generatedFiles.includes('entityMongo') ? `export * from './${entityName}.Entity.Mongo';` : null,
                generatedFiles.includes('entityPostgreSQL') ? `export * from './${entityName}.Entity.PostgreSQL';` : null
            ].filter(Boolean).join('\n'),
            condition: generatedFiles.includes('entityMongo') || generatedFiles.includes('entityPostgreSQL')
        },
        {
            path: 'lib/SmartDB/FrontEnd/index.ts',
            content: `export * from './${entityName}.FrontEnd.Api.Calls';`,
            condition: generatedFiles.includes('frontend')
        }
    ];

    for (const file of configFiles) {
        if (file.condition) {
            const filePath = path.join(outputDir, file.path);
            try {
                await fs.ensureFile(filePath);
                const existingContent = await fs.readFile(filePath, 'utf-8');
                if (!existingContent.includes(file.content)) {
                    await fs.appendFile(filePath, `\n${file.content}`);
                    console.log(chalk.green(`✅ Updated ${filePath}`));
                }
            } catch (error) {
                console.error(chalk.red(`❌ Error updating ${filePath}: ${error}`));
            }
        }
    }

//     // Handle the special case of backEnd.ts
//     const backEndPath = path.join(outputDir, 'lib/SmartDB/backEnd.ts');
//     const backEndContent = `
// import { EndpointsManager, initBackEnd as initBackEndSmartDB } from 'smart-db/backEnd';
// export * from 'smart-db/backEnd';
// export * from './BackEnd/index';
// export * from './Entities/index.BackEnd';

// // NOTE: It is very important that this file is used to import from all API endpoints
// // so that all necessary decorators of all classes are generated.

// export function initBackEnd() {
//     initBackEndSmartDB();
//     const endpointsManager = EndpointsManager.getInstance();
//     // endpointsManager.setPublicEndPointsInternet([/^\\/api\\/blockfrost\\/.+/]);
//     // endpointsManager.setPublicEndPointsInternet([/^\\/api\\/dummy\\/all/]);
// }
// `;

    // try {
    //     await fs.outputFile(backEndPath, backEndContent);
    //     console.log(`Created/Updated ${backEndPath}`);
    // } catch (error) {
    //     console.error(`Error creating/updating ${backEndPath}: ${error}`);
    // }
}