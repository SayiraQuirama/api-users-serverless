'use strict';

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const { v4: uuidv4 } = require('uuid');
const sns = new AWS.SNS();

module.exports.getUsers = async (event) => {
  const params = {
    TableName: TABLE_NAME,
  };
  
  try {
    const data = await dynamoDB.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve users' }),
    };
  }
};

module.exports.addUser = async (event) => {
  const newUser = JSON.parse(event.body);
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: uuidv4(),
      nombre: newUser.nombre,
      cedula: newUser.cedula,
    },
  };

  try {
    await dynamoDB.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify(params.Item),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

module.exports.updateUser = async (event) => {
  const userId = event.pathParameters.id;
  const updatedUser = JSON.parse(event.body);
  
  const params = {
    TableName: TABLE_NAME,
    Key: { id: userId },
    UpdateExpression: 'SET nombre = :nombre, cedula = :cedula',
    ExpressionAttributeValues: {
      ':nombre': updatedUser.nombre,
      ':cedula': updatedUser.cedula,
    },
  };

  try {
    await dynamoDB.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ id: userId, ...updatedUser }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

module.exports.deleteUser = async (event) => {
  const userId = event.pathParameters.id;
  
  const params = {
    TableName: TABLE_NAME,
    Key: { id: userId },
  };

  try {
    await dynamoDB.delete(params).promise();
    return {
      statusCode: 204,
      body: null,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not delete user' }),
    };
  }
};

module.exports.sendEmail = async (event) => {
  const { subject, message } = JSON.parse(event.body);

  const params = {
    Message: message,
    Subject: subject,
    TopicArn: process.env.TOPIC_ARN,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional'
      },
    },
  };

  try {
    await sns.publish(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};