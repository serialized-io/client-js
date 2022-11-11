# Contributing

We are open to, and grateful for, any contributions made by the community. By contributing to this project, you agree to
abide by the [code of conduct](https://github.com/serialized-io/client-js/blob/main/CODE_OF_CONDUCT.md).

### Testing

Please update the tests to reflect your code changes. Pull requests will not be accepted if they are failing.

### Developing

- `npm run test` run test suite
- `npm run build` build distribution package
- `npm version major | minor | patch` prepare the code for release

### Releasing

Releasing a new version is mostly automated. Versions should follow [semantic versioning](http://semver.org/).

- `npm version major | minor | patch`
- `git push --tags`
- `git push`

