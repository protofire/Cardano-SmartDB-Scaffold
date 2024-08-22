# MongoDB Entity Generator

This program generates MongoDB entities using GraphQL, with the schema currently embedded in `/src/typedef/schema.ts`. In the future, the schema will be moved to a separate file for easier management.

## Installation

To install the necessary dependencies, clone the repository and run `yarn` in the project directory:

```bash
git clone git@github.com:Fran-cio/codegen-resolvers-example.git codegen
cd codegen 
yarn
```

## Usage

To generate all the directories and entities, run the following command:

```bash
yarn generate
```

This will automatically create the necessary files and directories based on the GraphQL schema.

