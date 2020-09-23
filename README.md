# factory-commands

Global commands for fbi.

> This is a factory for [fbi v4](https://github.com/fbi-js/fbi). If you haven't installed fbi yet, use the following command to install.
>
> `$ npm i -g fbi`


## Requirements

- `fbi v4+`
- `node v10+`

## Usage

**Install**

```bash
$ fbi add factory-commands
```

**Run**

```bash
$ fbi [command]

$ fbi ls
```

## Commands

- `commit`: git commit and npm publish flow, formatting commit messages with commitizen. [more](./src/commands/commit/README.md)
- `lint`: Lint js/ts/vue/react code with [eslint-plugin-fbi](https://github.com/fbi-js/eslint-plugin-fbi). [more](./src/commands/lint/README.md)

## License

Licensed under [MIT](https://opensource.org/licenses/MIT).
