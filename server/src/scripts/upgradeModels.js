const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../models');

const models = [
  'Role.js', 'Permission.js', 'Application.js', 'Session.js', 'AuditLog.js', 
  'RefreshToken.js', 'MfaSettings.js', 'UserRole.js', 'RolePermission.js', 
  'UserApplicationAccess.js', 'AuthorizationCode.js'
];

models.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has tenantId
  if (content.includes('tenantId: {') || content.includes('tenantId: mongoose.Schema')) return;

  // Find the start of the schema definition: new mongoose.Schema({
  // We need to inject the tenantId field immediately after.
  const schemaStartRegex = /new mongoose\.Schema\(\s*\{/;
  const match = content.match(schemaStartRegex);
  
  if (match) {
    const injectStr = `
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },`;
    
    const insertPos = match.index + match[0].length;
    content = content.slice(0, insertPos) + injectStr + content.slice(insertPos);
  }

  // Remove `unique: true` from fields and gather them to add compound indexes
  const uniqueRegex = /^\s*([a-zA-Z0-9_]+):\s*\{[^}]*?unique:\s*true,?[^}]*?\}/gm;
  
  const fieldsToIndex = [];
  
  let newContent = content;
  let matches;
  while ((matches = uniqueRegex.exec(content)) !== null) {
      // Find the field name
      const fieldName = matches[1];
      fieldsToIndex.push(fieldName);
  }

  // Strip `unique: true`
  newContent = newContent.replace(/unique:\s*true,?\s*/g, '');

  // Add the compound indexes at the bottom of the schema, right before module.exports
  if (fieldsToIndex.length > 0) {
      let indexesToAdd = '';
      const schemaNameMatch = newContent.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*new\s+mongoose\.Schema/);
      const schemaName = schemaNameMatch ? schemaNameMatch[1] : 'schema';

      fieldsToIndex.forEach(f => {
          indexesToAdd += `\n${schemaName}.index({ tenantId: 1, ${f}: 1 }, { unique: true });`;
      });

      const moduleExportIndex = newContent.lastIndexOf('module.exports');
      if (moduleExportIndex !== -1) {
          newContent = newContent.slice(0, moduleExportIndex) + indexesToAdd + '\n\n' + newContent.slice(moduleExportIndex);
      }
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`Updated ${file}`);
});
