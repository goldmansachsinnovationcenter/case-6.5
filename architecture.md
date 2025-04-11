# Address Book API Architecture

```
+------------------------------------------+
|                                          |
|            AWS Cloud                     |
|                                          |
|  +-------------+      +--------------+   |
|  |             |      |              |   |
|  | API Gateway +----->+ Lambda       |   |
|  |             |      | Functions    |   |
|  +------+------+      +------+-------+   |
|         ^                     |          |
|         |                     v          |
|  +------+------+      +--------------+   |
|  |             |      |              |   |
|  | CloudWatch  |      | DynamoDB     |   |
|  | Alarms      |      | Table        |   |
|  |             |      |              |   |
|  +-------------+      +--------------+   |
|                                          |
+------------------------------------------+

```

## Component Interactions

1. **Client → API Gateway**: 
   - Clients make HTTP requests to the API Gateway endpoints
   - Endpoints: /contacts (GET, POST), /contacts/{id} (GET, PUT, DELETE)

2. **API Gateway → Lambda Functions**:
   - API Gateway routes requests to the appropriate Lambda function
   - Each endpoint is mapped to a specific Lambda function

3. **Lambda Functions → DynamoDB**:
   - Lambda functions perform CRUD operations on the DynamoDB table
   - Functions use AWS SDK to interact with DynamoDB

4. **CloudWatch Monitoring**:
   - API Gateway and Lambda metrics are sent to CloudWatch
   - CloudWatch Alarms trigger based on predefined thresholds
   - Auto Scaling adjusts Lambda provisioned concurrency based on utilization

## CDK Implementation

The architecture is implemented using AWS CDK with two main constructs:

1. **MyCustomConstruct**: 
   - Creates the DynamoDB table and API Gateway
   - Sets up basic CloudWatch alarms

2. **AddressBookStack**:
   - Instantiates the custom construct
   - Implements Lambda functions for each API operation
   - Connects Lambda functions to API Gateway routes
   - Sets up additional CloudWatch alarms and auto-scaling
