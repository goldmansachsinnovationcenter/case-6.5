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

    if (!event.body) {
      return formatResponse(400, { message: 'Missing request body' });
    }

    const contactData = JSON.parse(event.body);
    
    if (!contactData.name) {
      return formatResponse(400, { message: 'Name is required' });
    }

    const getResult = await dynamoDb.get({
      TableName: TABLE_NAME,
      Key: { id: contactId }
    }).promise();

    if (!getResult.Item) {
      return formatResponse(404, { message: 'Contact not found' });
    }

    const timestamp = new Date().toISOString();
    
    const updateExpression = 'SET #name = :name, email = :email, phone = :phone, address = :address, updatedAt = :updatedAt';
    
    const result = await dynamoDb.update({
      TableName: TABLE_NAME,
      Key: { id: contactId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': contactData.name,
        ':email': contactData.email || null,
        ':phone': contactData.phone || null,
        ':address': contactData.address || null,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return formatResponse(200, result.Attributes);
  } catch (error) {
    console.error('Error updating contact:', error);
    return formatResponse(500, { message: 'Could not update contact' });
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
