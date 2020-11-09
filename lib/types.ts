class SerializedConfig {

  constructor(public readonly accessKey: string,
              public readonly secretAccessKey: string) {
  }

  public validateConfiguration() {
    if (!this.accessKey) {
      throw "accessKey is missing in client configuration"
    }
    if (!this.secretAccessKey) {
      throw "accessKey is missing in client configuration"
    }
  }

}

export {SerializedConfig}
