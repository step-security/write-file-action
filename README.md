[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# Write File Action

This action writes a file.

## Inputs

### `path`

**Required** The path to the file to write.

### `contents`

**Required** The contents of the file.

### `write-mode`

**Optional** The mode of writing to use: `overwrite`, `append`, or `preserve`.

Modes:

- `overwrite` - overwrite the file if it exists
- `append` - if the file exists, it will be appended to
- `preserve` - if the file already exists the contents will not be written to

**Default** `append`

## Outputs

### `size`

Returns the file size.

## Example usage

```yaml
uses: step-security/write-file-action@v1
with:
  path: ${{ env.home}}/.bashrc
  contents: |
    Hello World!
  write-mode: append
```

## Example usage with checkout, commit and push
```yaml
name: Overwrite some file

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v6

      - name: Overwrite file
        uses: "step-security/write-file-action@v1"
        with:
          path: path/to/file.js
          write-mode: overwrite
          contents: |
            console.log('some contents')
            
      - name: Commit & Push
        uses: Andro999b/push@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: main
          force: true
          message: 'Overwritten by Github Actions - ${date}'
```
