import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Contact, ContactResponse } from './types';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.CONTACTS_TABLE_NAME || 'Contacts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return formatResponse(400, { message: 'Missing request body' });
    }

    const contactData = JSON.parse(event.body);
    
    if (!contactData.name) {
      return formatResponse(400, { message: 'Name is required' });
    }

    const timestamp = new Date().toISOString();
    
    const contact: Contact = {
      id: uuidv4(),
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      address: contactData.address,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoDb.put({
      TableName: TABLE_NAME,
      Item: contact
    }).promise();

    return formatResponse(201, contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return formatResponse(500, { message: 'Could not create contact' });
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
