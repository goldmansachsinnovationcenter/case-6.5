#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AddressBookStack } from '../lib/stacks/address-book-stack';

const app = new cdk.App();
new AddressBookStack(app, 'AddressBookStack');
