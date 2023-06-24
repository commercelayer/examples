// You don't need to import fetch, Zapier supports it by default.
import fetch from "node-fetch";

//test data
const inputData = {
  customerName: "Bolaji",
  orderTimeStamp: "2022-09-25T23:00:00.000Z",
  dateFormat: "DD MMMM, YYYY h:mm:ss A",
  timezoneOffset: "-0800",
  shipmentNumber:
    "Wire Transfer,Shipment #27309010/S/001,Eco Tote Bag with Black Logo,Samsung Galaxy S21 Plus Case with White Logo,Enamel Mug with Black Logo (12oz),Black Unisex 3/4 Sleeve Shirt with White Logo (L),Black Drawstring Bag with White Logo,White Apron with Black Logo",
  orderNumber: "21527675",
  customerEmail: "bolaji@commercelayer.io",
  marketName: "USA",
  paymentMethod: "Wire Transfer",
  shippingAddress:
    "Bolaji Ayodeji, 333 Fremont Street, 94016 San Francisco CA (US) +14845219712",
  shippingMethod: "Express Delivery",
  lineItems:
    '<table class="line-items"> <tr class="line-item"> <td class="line-item-image"> <img src="https://data.commercelayer.app/seed/images/skus/TOTEBAGXE7DDC7000000XXXX_FLAT.png" /> </td> <td class="line-item-name">Eco Tote Bag with Black Logo</td> <td class="line-item-qty">x 1</td> <td class="line-item-amount">$28.00</td> </tr> <tr class="line-item"> <td class="line-item-image"> <img src="https://data.commercelayer.app/seed/images/skus/GLCS21PXXXXXXXFFFFFFXXXX_FLAT.png" /> </td> <td class="line-item-name">Samsung Galaxy S21 Plus Case with White Logo</td> <td class="line-item-qty">x 1</td> <td class="line-item-amount">$19.00</td> </tr> <tr class="line-item"> <td class="line-item-image"> <img src="https://data.commercelayer.app/seed/images/skus/EMUG12OZFFFFFF000000XXXX_FLAT.png" /> </td> <td class="line-item-name">Enamel Mug with Black Logo (12oz)</td> <td class="line-item-qty">x 1</td> <td class="line-item-amount">$15.00</td> </tr> <tr class="line-item"> <td class="line-item-image"> <img src="https://data.commercelayer.app/seed/images/skus/SHIRT34S000000FFFFFFLXXX_FLAT.png" /> </td> <td class="line-item-name"> Black Unisex 3/4 Sleeve Shirt with White Logo (L) </td> <td class="line-item-qty">x 1</td> <td class="line-item-amount">$96.00</td> </tr> <tr class="line-item"> <td class="line-item-image"> <img src="https://data.commercelayer.app/seed/images/skus/DRAWSBAG000000FFFFFFXXXX_FLAT.png" /> </td> <td class="line-item-name">Black Drawstring Bag with White Logo</td> <td class="line-item-qty">x 1</td> <td class="line-item-amount">$22.00</td> </tr> <tr class="line-item"> <td class="line-item-image"> <img src="https://data.commercelayer.app/seed/images/skus/APRONXXXFFFFFF000000XXXX_FLAT.png" /> </td> <td class="line-item-name">White Apron with Black Logo</td> <td class="line-item-qty">x 2</td> <td class="line-item-amount">$40.00</td> </tr></table>',
  totalAmount: "$220",
  shippingAmount: "$7",
  grandTotalAmount: "$227",
};

const apiKey = "YOUR_API_KEY";

// You don't need to write a function; the “Code by Zapier” action already wraps the code in an async function.
async function sendEmail() {
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: {
        email: "bolaji@lorem.io",
        name: "Cake Store Team",
      },
      reply_to: {
        email: "bolaji@lorem.io",
        name: "Cake Store Customer Support",
      },
      personalizations: [
        {
          to: [
            {
              email: inputData.customerEmail,
            },
          ],
          dynamic_template_data: {
            customerName: inputData.customerName,
            orderTimeStamp: inputData.orderTimeStamp,
            dateFormat: "DD MMMM, YYYY h:mm:ss A",
            timezoneOffset: "-0800",
            shipmentNumber: `${
              inputData.shipmentNumber.match(/#\d{8}\/S\/\d{3}/g)[0]
            }`,
            orderNumber: inputData.orderNumber,
            customerEmail: inputData.customerEmail,
            marketName: inputData.marketName,
            paymentMethod: inputData.paymentMethod,
            shippingAddress: inputData.shippingAddress,
            shippingMethod: inputData.shippingMethod,
            lineItems: inputData.lineItems,
            totalAmount: inputData.totalAmount,
            shippingAmount: inputData.shippingAmount,
            grandTotalAmount: inputData.grandTotalAmount,
          },
        },
      ],
      template_id: "d-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    }),
  })
    .then((response) => {
      output = {
        response: response,
        status: response.status,
      };
      if (output.status === 202) {
        console.log(`Email sent to ${inputData.customerEmail}!`);
      }
      console.log(output);
    })
    .catch((error) => {
      console.error(error);
    });
}
sendEmail();
