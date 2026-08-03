/**
 * config/branding.js
 * -----------------------------------------------------------------------------
 * PRIEST MD — Developed by Inkora Systems
 * Single source of truth for the official brand. NEVER redesign the logo.
 * -----------------------------------------------------------------------------
 */

'use strict';

const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

module.exports = Object.freeze({
  name: 'Priest MD',
  developer: 'Inkora Systems',
  tagline: 'Developed by Inkora Systems',
  version: '1.0.0',
  officialBranding: 'Priest MD — Developed by Inkora Systems',

  /** Logo files (official, do not replace). */
  logo: {
    logo: path.join(ASSETS_DIR, 'logo', 'logo.png'),
    svg: path.join(ASSETS_DIR, 'logo', 'logo.svg'),
    iconRound: path.join(ASSETS_DIR, 'logo', 'icon-round.png'),
    iconSquare: path.join(ASSETS_DIR, 'logo', 'icon-square.png'),
    favicon: path.join(ASSETS_DIR, 'logo', 'favicon.png'),
  },

  /** Colors used across CLI + dashboards. */
  colors: {
    primary: '#7B2FBE',   // deep purple
    accent: '#D4AF37',    // gold
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  /** ASCII banner shown on startup. */
  banner: `
╔════════════════════════════════════════════╗
                                             
             PRIEST MD
                                            
      Developed by Inkora Systems
                                            
             Version 1.0.0
                                             
╚════════════════════════════════════════════╝
  `,
});
