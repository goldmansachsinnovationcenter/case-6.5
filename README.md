# Address Book API - CDK Implementation

This project implements a serverless Address Book API using AWS CDK with custom constructs. The implementation provides a complete backend solution for managing contacts with automated deployment, monitoring, and scaling capabilities.

## Implementation Details

### Architecture
- **AWS CDK**: Infrastructure as Code using TypeScript
- **Custom Construct**: Reusable CDK construct for the Address Book API
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Serverless compute for API operations
- **DynamoDB**: NoSQL database for contact storage
- **CloudWatch**: Monitoring and alerting
- **Auto Scaling**: Automatic scaling of Lambda provisioned concurrency

### Key Components
1. **Custom Construct (`MyCustomConstruct`)**: 
   - Creates the DynamoDB table with partition key 'id'
   - Sets up the API Gateway with logging and metrics
   - Configures CloudWatch alarms for API errors

2. **Address Book Stack**:
   - Implements Lambda functions for CRUD operations
   - Connects Lambda functions to API Gateway
   - Sets up CloudWatch alarms for monitoring
   - Configures auto-scaling for Lambda functions

3. **Lambda Functions**:
   - All Lambda functions interact with DynamoDB using AWS SDK
   - Proper error handling and consistent response formats
   - Environment variables for configuration

## API Outline

### Endpoints

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|-------------|
| GET | /contacts | List all contacts | 200, 500 |
| POST | /contacts | Create a new contact | 201, 500 |
| GET | /contacts/{id} | Get a specific contact | 200, 404, 500 |
| PUT | /contacts/{id} | Update a contact | 200, 500 |
| DELETE | /contacts/{id} | Delete a contact | 204, 500 |

### Request/Response Examples

#### List Contacts
```
GET /contacts
Response: 
{
  "statusCode": 200,
  "body": [
    {
      "id": "contact-1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "123-456-7890",
      "createdAt": "2023-04-07T12:34:56.789Z"
    },
    ...
  ]
}
```

#### Create Contact
```
POST /contacts
Request Body:
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "987-654-3210"
}

Response:
{
  "statusCode": 201,
  "body": {
    "id": "contact-1234567890",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "987-654-3210",
    "createdAt": "2023-04-07T12:34:56.789Z"
  }
}
```

## Monitoring and Scaling

- **CloudWatch Alarms**:
  - API Gateway 5xx errors (threshold: 1)
  - API Gateway 4xx errors (threshold: 10)
  - Lambda function errors (threshold: 1)

- **Auto Scaling**:
  - Lambda provisioned concurrency scales based on utilization
  - Min capacity: 1, Max capacity: 10
  - Target utilization: 10

## Deployment

The stack can be deployed using the AWS CDK CLI:

```
npm run build
cdk synth
cdk deploy
```

## Acceptance Criteria Met

- ✅ API operations (Browse, Search, Add, Delete, Update contacts)
- ✅ Automated deployment via CDK
- ✅ Monitoring via CloudWatch and CloudWatch alarms
- ✅ Auto-scaling of Lambda functions
- ✅ Alert system for application failures
