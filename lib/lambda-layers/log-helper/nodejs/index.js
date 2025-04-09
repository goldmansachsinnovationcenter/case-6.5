/**
 * Helper functions for Lambda functions to interact with CloudWatch Logs
 */
const AWS = require('aws-sdk');
const logs = new AWS.CloudWatchLogs();

/**
 * Write a log entry to the Lambda's log group
 * @param {string} message - The message to log
 * @param {object} data - Additional data to include in the log
 * @param {string} level - Log level (info, warn, error)
 */
exports.writeLog = async (message, data = {}, level = 'info') => {
  const logGroupName = process.env.LOG_GROUP_NAME;
  if (!logGroupName) {
    console.error('LOG_GROUP_NAME environment variable is not set');
    return;
  }
  
  const logObject = {
    message,
    data,
    timestamp: new Date().toISOString(),
    level,
  };
  console.log(JSON.stringify(logObject));
  
  try {
    const logStreamName = `${process.env.AWS_LAMBDA_FUNCTION_NAME}-${Date.now()}`;
    
    try {
      await logs.describeLogStreams({
        logGroupName,
        logStreamNamePrefix: logStreamName,
      }).promise();
    } catch (error) {
      await logs.createLogStream({
        logGroupName,
        logStreamName,
      }).promise();
    }
    
    await logs.putLogEvents({
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message: JSON.stringify(logObject),
          timestamp: Date.now(),
        },
      ],
    }).promise();
  } catch (error) {
    console.error('Error writing to CloudWatch Logs:', error);
  }
};

/**
 * Read log entries from the Lambda's log group
 * @param {object} options - Options for reading logs
 * @param {string} options.filterPattern - Pattern to filter logs
 * @param {number} options.limit - Maximum number of log events to return
 * @param {string} options.startTime - Start time for log events
 * @param {string} options.endTime - End time for log events
 * @returns {Promise<Array>} - Array of log events
 */
exports.readLogs = async (options = {}) => {
  const logGroupName = process.env.LOG_GROUP_NAME;
  if (!logGroupName) {
    console.error('LOG_GROUP_NAME environment variable is not set');
    return [];
  }
  
  try {
    const params = {
      logGroupName,
      filterPattern: options.filterPattern || '',
      limit: options.limit || 100,
    };
    
    if (options.startTime) {
      params.startTime = new Date(options.startTime).getTime();
    }
    
    if (options.endTime) {
      params.endTime = new Date(options.endTime).getTime();
    }
    
    const result = await logs.filterLogEvents(params).promise();
    return result.events.map(event => {
      try {
        return JSON.parse(event.message);
      } catch (error) {
        return { message: event.message };
      }
    });
  } catch (error) {
    console.error('Error reading from CloudWatch Logs:', error);
    return [];
  }
};
