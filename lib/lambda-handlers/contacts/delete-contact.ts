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

    const getResult = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id: contactId }
    }).promise();

    if (!getResult.Item) {
      return formatResponse(404, { message: 'Contact not found' });
    }

    await dynamoDb.delete({
      TableName: TABLE_NAME,
      Key: { id: contactId }
    }).promise();

    return formatResponse(204, {});
  } catch (error) {
    console.error('Error deleting contact:', error);
    return formatResponse(500, { message: 'Could not delete contact' });
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
