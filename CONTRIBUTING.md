# Contribute Guide

## Pull Request Guidelines

- Checkout a topic branch from `main` branch, and merge back against that branch.
- Work in the `src` and `templates` folders.
- Use [fbi commit](https://github.com/fbi-js/factory-commands/blob/main/src/commands/commit/README.md) to commit your code.

## Development

- Setup

   ```bash
   npm i -g fbi
   yarn

   # link local factory to global env, so you can use it everywhere in terminal. (like `npm link`)
   fbi link
   ```

- Start development

   ```bash
   yarn watch
   ```

## Test

- In a git repository folder

  ```bash
  fbi commit
  ```

## Project Structure

- `src`
  - `index.ts`: factory class entry file. It extends [`fbi` `Factory`](https://github.com/fbi-js/fbi).
  - `src/commands`: contains all executable commands which extends [`fbi` `Command`](https://github.com/fbi-js/fbi).
