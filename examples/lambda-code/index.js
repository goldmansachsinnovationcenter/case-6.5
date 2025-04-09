/**
 * Example Lambda function that uses the log helper layer
 */

const { writeLog, readLogs } = require('/opt/nodejs/index');

/**
 * Lambda handler function
 */
exports.handler = async (event, context) => {
  try {
    await writeLog('Received event', { event }, 'info');
    
    const result = processEvent(event);
    
    await writeLog('Processed event successfully', { result }, 'info');
    
    const recentLogs = await readLogs({
      limit: 10,
      filterPattern: 'Processed',
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Event processed successfully',
        result,
        recentLogs,
      }),
    };
  } catch (error) {
    await writeLog('Error processing event', { error: error.message, stack: error.stack }, 'error');
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing event',
        error: error.message,
      }),
    };
  }
};

/**
 * Process the event
 * @param {object} event - The event to process
 * @returns {object} - The processed event
 */
function processEvent(event) {
  return {
    processedAt: new Date().toISOString(),
    eventType: event.type || 'unknown',
    eventId: event.id || Math.random().toString(36).substring(2, 15),
  };
}
