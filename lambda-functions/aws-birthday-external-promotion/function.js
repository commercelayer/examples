const AWS = require("aws-sdk");

exports.handler = async (event) => {
  let body, statusCode;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const customer = JSON.parse(event.body).data.attributes.customer_email;
    const customer_dob = await getCustomerDob(customer);

    if (customer_dob) {
      console.log(customer_dob);
      if (isBirthdayToday(customer_dob)) {
        statusCode = 200;
        body = {
          success: true,
          data: {
            name: "Birthday Promo",
            discount_cents: 1500,
          },
        };
      }
    } else {
      statusCode = 404;
      body = {
        success: "false",
        error: {
          code: "error 2",
          message: "customer not found!",
        },
      };
    }
  } catch (err) {
    statusCode = 500;
    body = {
      success: "false",
      error: {
        code: "error 1",
        message: err.message,
      },
    };
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    headers,
    body,
  };
};

// Get Customer Date of Birth from a Dynamo DB
async function getCustomerDob(customer) {
  const dynamo = new AWS.DynamoDB.DocumentClient();
  let customer_dob;
  customer_dob = await dynamo
    .get({
      TableName: "CUSTOMER_DOB",
      Key: {
        EMAIL: customer,
      },
    })
    .promise();

  return customer_dob.Item;
}

// Simple function that says if today date match a date of Birth (dob)
function isBirthdayToday(dob) {
  if (
    dob.DOB_M == new Date().getMonth() + 1 &&
    dob.DOB_D == new Date().getDate()
  )
    return true;
  else return false;
}
