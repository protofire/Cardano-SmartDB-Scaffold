# Cardano SmartDB - Scaffold & Code Generator

This program generates MongoDB entities using GraphQL. The schema is defined in the `schema.graphql` file.
## Installation

To install the necessary dependencies, clone the repository and run `yarn` in the project directory:

```bash
git clone git@github.com:protofire/Cardano-SmartDB-Scaffold.git
cd Cardano-SmartDB-Scaffold
yarn install
```

## Usage

To generate graphQL schema:

```bash
yarn smartdb-graphql-gen
```


To generate all the directories and entities, run the following command:

```bash
yarn smartdb-code-gen
```

This will automatically create the necessary files and directories based on the GraphQL schema.

