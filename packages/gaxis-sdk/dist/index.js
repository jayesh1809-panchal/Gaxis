const GAxisSDK = require('./GAxisSDK');
const ConfigLoader = require('./config/loader');
const VersionManager = require('./utils/version');
const {
  GAxisError,
  ConfigurationError,
  ValidationError,
  AuthenticationError,
  NetworkError
} = require('./utils/errors');
const {
  StorageAbstraction,
  MemoryStorage
} = require('./utils/storage');

// Adapters
const MongooseUserAdapter = require('./identity/adapters/MongooseUserAdapter');
const SequelizeUserAdapter = require('./identity/adapters/SequelizeUserAdapter');
const CustomUserAdapter = require('./identity/adapters/CustomUserAdapter');
module.exports = {
  // Core
  GAxisSDK,
  ConfigLoader,
  VersionManager,
  // Errors
  Errors: {
    GAxisError,
    ConfigurationError,
    ValidationError,
    AuthenticationError,
    NetworkError
  },
  // Storage Types
  Storage: {
    StorageAbstraction,
    MemoryStorage
  },
  // Adapters
  Adapters: {
    MongooseUserAdapter,
    SequelizeUserAdapter,
    CustomUserAdapter
  }
};