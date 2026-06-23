const fs = require('fs/promises');
const path = require('path');
class ReactAdapter {
  async bootstrap(applicationRecord) {
    const bootPath = path.resolve(process.cwd(), 'GAxisBootstrap.jsx');
    const content = `
// ==========================================
// G-Axis React Bootstrapper
// Automatically generated for ${applicationRecord.applicationName}
// ==========================================
import React from 'react';
import { GAxisProvider } from '@gaxis/react-sdk';

const gaxisConfig = {
    baseUrl: process.env.REACT_APP_GAXIS_BASE_URL || process.env.VITE_GAXIS_BASE_URL,
    clientId: process.env.REACT_APP_GAXIS_CLIENT_ID || process.env.VITE_GAXIS_CLIENT_ID
};

export const GAxisBootstrap = ({ children }) => {
    return (
        <GAxisProvider config={gaxisConfig}>
            {children}
        </GAxisProvider>
    );
};
`;
    await fs.writeFile(bootPath, content.trim() + '\n');
    return bootPath;
  }
}
module.exports = ReactAdapter;