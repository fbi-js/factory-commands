# fbi commit

git commit and npm publish flow, formatting commit messages with commitizen.

> This is a fbi task. If you haven't installed
> [fbi v4](https://github.com/fbi-js/fbi/tree/v4.x) yet, use the following command to
> install.
>
> `$ npm i -g fbi` or `yarn global add fbi`

<img src="../../../assets/commit.gif">

## Requirements

- `fbi v4+`
- `node v10+`

## Features

- flow of `git add`, `git commit`, `git push`, `git tag`,
  `npm version major/minor/patch`, `npm publish`, and changelog generation
- formatting commit messages with commitizen
- version standard: [Semantic Versioning](https://semver.org/)
- `git commit` and `changelog` style:
  [Angular commit style](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#heading=h.7mqxm4jekyct)
  - commit message format: `type(scope): subject`
  - commit types: [cz-fbi](https://github.com/neikvon/cz-fbi#docs)
  - changelog: only `new features, bug fixes, breaking changes` will show in
    `CHANGELOG.md`

## Format

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

## Usage

**Install**

```bash
$ fbi add factory-commands
```

**Run**

```bash
$ cd path/to/git/repository
$ fbi commit
```

**Demo**

- ? type of change (required): `feat ✨ Introducing new features`
- ? affected scope (optional): `page`
- ? short description (required): `add a new page`
- ? longer description (optional): `\n - first \n - second \n - third`
- ? issue closed (optional): `#666 #999`
- ? breaking change (optional): `some breaking changes`

  > result:

  ```bash
  feat(page): add a new page

  - first
  - second
  - third

  fixed #666, fixed #999

  BREAKING CHANGE:
  some breaking changes
  ```
