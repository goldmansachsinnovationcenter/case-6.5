import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ContactResponse } from './types';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONTACTS_TABLE_NAME || 'Contacts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const contactId = event.pathParameters?.id;
    
    if (!contactId) {
      return formatResponse(400, { message: 'Missing contact ID' });
    }

    const result = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id: contactId }
    }).promise();

    if (!result.Item) {
      return formatResponse(404, { message: 'Contact not found' });
    }

    return formatResponse(200, result.Item);
  } catch (error) {
    console.error('Error getting contact:', error);
    return formatResponse(500, { message: 'Could not retrieve contact' });
  }
};

const formatResponse = (statusCode: number, body: any): ContactResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
};
