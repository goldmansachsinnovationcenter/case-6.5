# Address Book Backend

This project implements a backend for an address book application using AWS CDK with TypeScript.

## Architecture

The backend uses the following AWS services:
- DynamoDB for storing contact information
- Lambda for API handlers
- API Gateway for RESTful endpoints
- IAM for permissions

## API Endpoints

The API provides the following endpoints:
- `GET /contacts` - List all contacts
- `GET /contacts/{id}` - Get a specific contact
- `POST /contacts` - Create a new contact
- `PUT /contacts/{id}` - Update an existing contact
- `DELETE /contacts/{id}` - Delete a contact
- `GET /contacts/search` - Search contacts by name, email, or phone

## Setup

1. Install dependencies:
```
npm install
```

2. Build the project:
```
npm run build
```

3. Deploy to AWS:
```
npx cdk deploy
```

## Development

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run tests
- `npx cdk synth` - Generate CloudFormation template
- `npx cdk diff` - Compare deployed stack with current state
- `npx cdk deploy` - Deploy this stack to your default AWS account/region
