# MongoDB Entity Generator

This program generates MongoDB entities using GraphQL. The schema is defined in the `schema.graphql` file.
## Installation

To install the necessary dependencies, clone the repository and run `yarn` in the project directory:

```bash
git clone git@github.com:Fran-cio/smartUTxoCodegen.git
cd smartUTxoCodegen
yarn
```

## Usage

To generate all the directories and entities, run the following command:

```bash
yarn generate
```

This will automatically create the necessary files and directories based on the GraphQL schema.

If you need to clean up the generated entity folders, you can use:

```bash
yarn clean
```

This command will remove the previously generated entity directories.
