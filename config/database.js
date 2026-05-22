const mongoose = require('mongoose');

class DatabaseConfig {
  constructor(options = {}) {
    this.connectionString =
      options.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/headsupeye';
    this.options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options.mongooseOptions,
    };
  }

  async connect() {
    try {
      await mongoose.connect(this.connectionString, this.options);
      console.log('Connected to MongoDB');

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      return mongoose.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = DatabaseConfig;
