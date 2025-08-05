const logger = require('../core/logger');
// features/moderation/index.js

const ban   = require('./ban.js');
const kick  = require('./kick.js');
const purge = require('./purge.js');

module.exports = {
  name: 'moderation',

  // Register all moderation commands:
  commands: [
    ban,
    kick,
    purge
  ],

  // No moderation-specific events yet:
  events: [],

  init(client) {
    logger.info(`🔧 [moderation] feature online.`);
  }
};

