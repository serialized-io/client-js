# Contributing

We are open to, and grateful for, any contributions made by the community. By contributing to axios, you agree to abide by the [code of conduct](https://github.com/serialized-io/client-js/blob/master/CODE_OF_CONDUCT.md).

### Commit Messages

Commit messages should be verb based, using the following pattern:

- `Fixing ...`
- `Adding ...`
- `Updating ...`
- `Removing ...`

### Testing

Please update the tests to reflect your code changes. Pull requests will not be accepted if they are failing.

### Developing

- `npm test` run test suite
- `npm build` build distribution package
- `npm version` prepare the code for release

### Releasing

Releasing a new version is mostly automated. Versions should follow [semantic versioning](http://semver.org/).

- `npm version <newversion> -m "Releasing %s"`
- `git push --tags`

