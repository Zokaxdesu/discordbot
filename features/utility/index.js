const logger = require('../core/logger');
// features/utility/index.js

const agegate            = require('./agegate.js');
const delcat             = require('./delcat.js');
const exportchannelnames = require('./exportchannelnames.js');
const exportserver       = require('./exportserver.js');
const ping               = require('./ping.js');

module.exports = {
  name: 'utility',

  // Register all utility commands:
  commands: [
    agegate,
    delcat,
    exportchannelnames,
    exportserver,
    ping
  ],

  // No feature-specific events
  events: [],

  init(client) {
    logger.info(`?? [utility] feature online.`);
  }
};