'use strict';

/**
 * User-facing brand migration compatibility loader.
 *
 * Only the exact mixed-case product word is replaced. Uppercase environment
 * variables (CAMPUSOS_*), lowercase cookie/event keys (campusos_*) and database
 * schema names intentionally remain untouched so the rebrand cannot break
 * authentication, integrations or stored data.
 */
module.exports = function navemoraBrandLoader(source) {
  return source.replace(/\bCampusOS\b/g, 'NAVEMORA');
};
