# Cardano SmartDB - Scaffold & Code Generator

## Table of Contents
- [Cardano SmartDB - Scaffold \& Code Generator](#cardano-smartdb---scaffold--code-generator)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Tools Overview](#tools-overview)
    - [1. GraphQL Schema Generator (smartdb-graphql-gen)](#1-graphql-schema-generator-smartdb-graphql-gen)
    - [2. Code Generator (smartdb-code-gen)](#2-code-generator-smartdb-code-gen)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Using npm](#using-npm)
    - [Using Binaries](#using-binaries)
    - [Building from Source](#building-from-source)
  - [Usage](#usage)
    - [Step 1: Generate GraphQL Schema](#step-1-generate-graphql-schema)
      - [SmartDB Entity Configuration](#smartdb-entity-configuration)
    - [Step 2: Generate Code](#step-2-generate-code)
  - [Integration with SmartDB Projects](#integration-with-smartdb-projects)
  - [Step-by-Step Guide](#step-by-step-guide)
  - [Best Practices](#best-practices)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgements](#acknowledgements)

## Introduction

The Cardano SmartDB Scaffold & Code Generator is a set of tools designed to streamline the development process for Cardano blockchain applications using the SmartDB library. These tools automate the creation of GraphQL schemas and generate boilerplate code for entities, making it easier to build and maintain Cardano dApps.

**Important Note:** These tools are specifically designed to work within projects that use the SmartDB library. They generate files and structures that are compatible with and expected by SmartDB-based projects. It is highly recommended to use these tools within a forked version of the Cardano-SmartDB-Template.

The toolkit consists of two main components:
1. GraphQL Schema Generator (smartdb-graphql-gen)
2. Code Generator (smartdb-code-gen)

## Tools Overview

### 1. GraphQL Schema Generator (smartdb-graphql-gen)

This tool helps you create and manage GraphQL schemas for your Cardano SmartDB entities. It provides an interactive command-line interface to:

- Create new entities or update existing ones
- Define fields for each entity
- Specify field types (including special types from Lucid Cardano and SmartDB)
- Set up indexes for efficient querying
- Generate a complete GraphQL schema file

### 2. Code Generator (smartdb-code-gen)

Based on the GraphQL schema created by the first tool, the Code Generator automatically scaffolds the necessary files and directories for your Cardano SmartDB project. It generates:

- Entity files
- MongoDB models
- PostgreSQL models
- Backend API handlers
- Frontend API calls
- React components (optional)
- Next.js pages (optional)

## Prerequisites

Before using these tools, ensure you have:
- Node.js (version 16 or later)
- npm or yarn
- A project set up using the Cardano-SmartDB-Template (recommended)

## Installation

### Using npm

To install globally using npm:

```
npm install -g smartdb-scaffold-tools
```

### Using Binaries

For easy use, we provide pre-built binaries for different platforms. You can download them from our GitHub releases page:

[Download SmartDB Scaffold & Code Generator Binaries](https://github.com/protofire/Cardano-SmartDB-Scaffold/releases)

Choose the appropriate binary for your operating system (Windows, macOS, or Linux) and add it to your system's PATH.

### Building from Source

If you prefer to build the tools from source:

1. Clone the repository:
```
git clone https://github.com/protofire/Cardano-SmartDB-Scaffold.git
```

2. Navigate to the project directory:
```
cd Cardano-SmartDB-Scaffold
```

3. Install dependencies:
```
npm install
```

4. Build the project:
```
npm run build
```

5. Link the tools globally (optional):
```
npm link
```

## Usage

### Step 1: Generate GraphQL Schema

To create or update your GraphQL schema:

1. Run the GraphQL Schema Generator:
```
smartdb-graphql-gen
```

2. Follow the interactive prompts to:
   - Select an existing schema file or create a new one
   - Create new entities or select existing ones to update
   - Define fields for each entity
   - Specify field types and properties
   - Set up indexes if needed

3. The tool will generate or update a GraphQL schema file in your specified location.

#### SmartDB Entity Configuration

When creating a SmartDB entity, you'll be prompted for additional configuration:

- plutusDataIsSubType: Enables subtype support in Plutus data
- plutusDataIndex: Index value for Plutus data (only if subtype enabled) 
- isNETIdUnique: Whether TokenName ID should be unique: set to true if the token ID is a NFT or set to false when a FT token is used. 
- tokenName: Token name (defaults to EntityNameID)

These parameters are essential for proper SmartDB entity operation and blockchain interaction.

### Step 2: Generate Code

After creating your GraphQL schema, use the Code Generator to scaffold your project:

1. Run the Code Generator:
```
smartdb-code-gen
```

2. The tool will prompt you to:
   - Select the GraphQL schema file to use
   - Choose which entities to generate code for
   - Select which types of files to generate (entity, MongoDB model, backend, frontend, etc.)
   - Specify the output directory for generated files

3. The Code Generator will create the necessary files and directories based on your selections.

## Integration with SmartDB Projects

These tools are designed to work seamlessly with projects built on the SmartDB library. To ensure compatibility and proper integration:

1. Start by forking the [Cardano-SmartDB-Template](https://github.com/protofire/Cardano-SmartDB-Template)
2. Clone your forked repository and set it up locally
3. Use the SmartDB Scaffold & Code Generator tools within this project structure
4. The generated files will be automatically placed in the correct directories, ready for use with SmartDB

## Step-by-Step Guide

1. Set up your project:
   - Clone the repository and install dependencies as described in the Installation section.

2. Create your GraphQL schema:
   - Run `npm run smartdb-graphql-gen` or `yarn smartdb-graphql-gen`
   - Follow the prompts to define your entities and their fields
   - Review the generated `schema.graphql` file

3. Generate code based on your schema:
   - Run `npm run smartdb-code-gen` or `yarn smartdb-code-gen`
   - Select the entities you want to generate code for
   - Choose the types of files you need (entity, MongoDB, backend, frontend, etc.)
   - Specify the output directory (usually `src` or a subdirectory)

4. Review generated code:
   - Check the output directory for the newly created files
   - Verify that all necessary files have been generated (entities, models, API handlers, etc.)

5. Customize generated code:
   - Modify the generated files as needed to fit your specific requirements
   - Add additional business logic, validation, or custom functionality

6. Integrate with your Cardano SmartDB project:
   - Copy or move the generated files to your main project directory if needed
   - Update any import statements or file paths to match your project structure

7. Test your generated code:
   - Run your application and test the newly created entities and API endpoints
   - Verify that CRUD operations work as expected for each entity

8. Iterate and refine:
   - As your project evolves, rerun the GraphQL Schema Generator to update your schema
   - Use the Code Generator again to create new files or update existing ones based on schema changes

## Best Practices

- Version control: Commit your GraphQL schema file to your version control system to track changes over time.
- Code review: Always review the generated code before integrating it into your project to ensure it meets your standards and requirements.
- Customization: While the generated code provides a solid starting point, don't hesitate to customize it to better fit your specific use case.
- Testing: Implement unit tests and integration tests for your generated entities and API endpoints to ensure reliability.
- Documentation: Keep your README and other documentation up to date as you add or modify entities in your project.

## Contributing

Contributions to the Cardano SmartDB Scaffold & Code Generator are welcome! If you have ideas for improvements or find any bugs, please:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with clear, descriptive messages
4. Push your changes to your fork
5. Submit a pull request with a detailed description of your changes

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

We express our deepest gratitude to the Cardano community for their unwavering support and valuable contributions to this project. This work is part of a funded project through Cardano Catalyst, a community-driven innovation platform. For more details on the proposal and its progress, please visit our proposal page on [IdeaScale](https://cardano.ideascale.com/c/idea/110478).


The step-by-step guide remains largely the same as in the previous version]

