const logger = require('../core/logger');
const irl      = require('./irl');
const r34      = require('./r34');
const pornpics = require('./pornpics');

module.exports = {
  name: 'fun',
  commands: [irl, r34, pornpics],

  // No feature-specific events here anymore
  events: [],

  init(client) {
    logger.info('?? [fun] feature online.');
  }
};
