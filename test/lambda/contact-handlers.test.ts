import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

jest.mock('aws-sdk', () => {
  const mockPromiseFn = jest.fn();
  const mDynamoDB = {
    DocumentClient: jest.fn().mockImplementation(() => {
      return {
        put: jest.fn().mockImplementation(() => {
          return { promise: mockPromiseFn };
        }),
        get: jest.fn().mockImplementation(() => {
          return { promise: mockPromiseFn };
        }),
        scan: jest.fn().mockImplementation(() => {
          return { promise: mockPromiseFn };
        }),
        update: jest.fn().mockImplementation(() => {
          return { promise: mockPromiseFn };
        }),
        delete: jest.fn().mockImplementation(() => {
          return { promise: mockPromiseFn };
        }),
        query: jest.fn().mockImplementation(() => {
          return { promise: mockPromiseFn };
        })
      };
    })
  };
  return { DynamoDB: mDynamoDB };
});

const mockContact = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'USA'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('Contact Lambda Handlers', () => {
  const AWS = require('aws-sdk');
  let mockPromiseFn: jest.Mock;
  
  beforeEach(() => {
    jest.resetModules();
    mockPromiseFn = require('aws-sdk').DynamoDB.DocumentClient().put().promise;
    mockPromiseFn.mockReset();
  });

  describe('Create Contact', () => {
    it('should create a contact successfully', async () => {
      mockPromiseFn.mockResolvedValueOnce({});
      
      const { handler } = require('../../lib/lambda-handlers/contacts/create-contact');
      
      const event = {
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
          }
        })
      } as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.name).toBe('John Doe');
    });

    it('should return 400 if name is missing', async () => {
      const { handler } = require('../../lib/lambda-handlers/contacts/create-contact');
      
      const event = {
        body: JSON.stringify({
          email: 'john@example.com'
        })
      } as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Get Contact', () => {
    it('should get a contact by ID', async () => {
      mockPromiseFn.mockResolvedValueOnce({ Item: mockContact });
      
      const { handler } = require('../../lib/lambda-handlers/contacts/get-contact');
      
      const event = {
        pathParameters: { id: '123' }
      } as unknown as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.id).toBe('123');
    });

    it('should return 404 if contact not found', async () => {
      mockPromiseFn.mockResolvedValueOnce({});
      
      const { handler } = require('../../lib/lambda-handlers/contacts/get-contact');
      
      const event = {
        pathParameters: { id: '999' }
      } as unknown as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(404);
    });
  });

  describe('List Contacts', () => {
    it('should list all contacts', async () => {
      mockPromiseFn.mockResolvedValueOnce({ 
        Items: [mockContact], 
        Count: 1 
      });
      
      const { handler } = require('../../lib/lambda-handlers/contacts/list-contacts');
      
      const event = {} as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.contacts.length).toBe(1);
      expect(body.count).toBe(1);
    });
  });

  describe('Update Contact', () => {
    it('should update a contact successfully', async () => {
      mockPromiseFn.mockResolvedValueOnce({ Item: mockContact });
      
      const updatedContact = { ...mockContact, name: 'Jane Doe' };
      mockPromiseFn.mockResolvedValueOnce({ Attributes: updatedContact });
      
      const { handler } = require('../../lib/lambda-handlers/contacts/update-contact');
      
      const event = {
        pathParameters: { id: '123' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com'
        })
      } as unknown as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.name).toBe('Jane Doe');
    });
  });

  describe('Delete Contact', () => {
    it('should delete a contact successfully', async () => {
      mockPromiseFn.mockResolvedValueOnce({ Item: mockContact });
      
      mockPromiseFn.mockResolvedValueOnce({});
      
      const { handler } = require('../../lib/lambda-handlers/contacts/delete-contact');
      
      const event = {
        pathParameters: { id: '123' }
      } as unknown as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(204);
    });
  });

  describe('Search Contacts', () => {
    it('should search contacts by name', async () => {
      mockPromiseFn.mockResolvedValueOnce({ 
        Items: [mockContact], 
        Count: 1 
      });
      
      const { handler } = require('../../lib/lambda-handlers/contacts/search-contacts');
      
      const event = {
        queryStringParameters: { name: 'John Doe' }
      } as unknown as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.contacts.length).toBe(1);
    });

    it('should return 400 if no search parameters provided', async () => {
      const { handler } = require('../../lib/lambda-handlers/contacts/search-contacts');
      
      const event = {
        queryStringParameters: {}
      } as unknown as APIGatewayProxyEvent;

      const result = await handler(event);
      expect(result.statusCode).toBe(400);
    });
  });
});
