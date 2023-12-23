const axios = require('axios');

async function createLogEntry(userId, transactionType, fileSize) {
  try {
    await axios.post('http://localhost:3000/log', {
      userId: userId,
      transactionType: transactionType,
      fileSize: fileSize,
    });
    console.log('Log entry created successfully');
  } catch (error) {
    console.error('Error creating log entry:', error.message);
    throw new Error('Failed to create log entry');
  }
}

module.exports = { createLogEntry };