import {v4 as uuidv4} from "uuid";
import {SerializedConfig} from "../../lib";
import nock = require("nock");

function randomKeyConfig() {
  return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
}

function mockSerializedApiCalls(config: SerializedConfig, tenantId?: string) {
  const reqheaders = {
    'Serialized-Access-Key': config.accessKey,
    'Serialized-Secret-Access-Key': config.secretAccessKey
  };
  if (tenantId) {
    reqheaders['Serialized-Tenant-Id'] = tenantId
  }
  return nock('https://api.serialized.io', {
    reqheaders: reqheaders
  });
}


module.exports = {randomKeyConfig, mockSerializedApiCalls}
