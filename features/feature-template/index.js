const logger = require('../core/logger');
// features/feature-template/index.js

/**
 * A template for a self-contained feature.
 * 
 * - name: unique identifier for this feature.
 * - commands: array of command modules (each has .data and .execute).
 * - events: array of event definitions (each has name, once, execute).
 * - init: optional startup function run once at bot boot.
 */

module.exports = {
  name: 'feature-template',

  // 1. Commands you want to register with the bot:
  commands: [
    // e.g. require('./commands/myCommand.js'),
  ],

  // 2. Discord events you want to listen for:
  events: [
    // { name: 'ready', once: true, execute: (client) => {} },
  ],

  // 3. Optional initialization logic:
  init(client /*, container for services if you add one later */) {
    logger.info(`🔌 [${this.name}] initialized`);
  }
};
