import {v4 as uuidv4} from "uuid";

function randomKeyConfig() {
  return {accessKey: uuidv4(), secretAccessKey: uuidv4()};
}

module.exports = {randomKeyConfig}
