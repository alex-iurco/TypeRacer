const mongoose = require('mongoose');

// Get MongoDB URI from environment variables or use a default (for development only)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/speedtype';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 