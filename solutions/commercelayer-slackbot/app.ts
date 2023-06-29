import * as dotenv from "dotenv";
dotenv.config();

import { App, LogLevel } from "@slack/bolt";
import { authentication } from "@commercelayer/js-auth";
import { database } from "./src/database/supabaseClient";
import { getOrderById, getLastOrder, getTodaysOrder } from "./src/orders/getOrders";
import { getReturnById, getLastReturn, getTodaysReturn } from "./src/returns/getReturns";
import { serveHtml } from "./src/utils/serveHtml";
import { getTokenInfo } from "./src/utils/getToken";
import { renderError, notFoundError, expiredTokenError } from "./src/utils/customError";
import { getSlug } from "./src/utils/parseText";
import { formatTimestamp } from "./src/utils/parseDate";
import { initConfig } from "./src/utils/config";

const app = new App({
  logLevel: LogLevel.DEBUG,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: [
    "channels:history",
    "chat:write",
    "chat:write.public",
    "commands",
    "groups:history",
    "im:history",
    "im:write",
    "incoming-webhook",
    "mpim:history",
    "mpim:write",
    "users:read"
  ],
  installationStore: {
    storeInstallation: async (installation, logger) => {
      logger.info("STORING SLACK INSTALLATION.....");
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        const { data, error } = await database.from("users").insert({
          slack_id: installation.enterprise.id,
          slack_installation_store: installation,
          is_enterprise: installation.isEnterpriseInstall
        });
        if (error) throw error;
        return data;
      }
      if (installation.team !== undefined) {
        const { data, error } = await database.from("users").insert({
          slack_id: installation.team.id,
          slack_installation_store: installation,
          is_enterprise: installation.isEnterpriseInstall
        });
        if (error) throw error;
        return data;
      }
      throw new Error("Failed saving installation data to installationStore.");
    },
    fetchInstallation: async (installQuery, logger) => {
      logger.info("FETCHING SLACK INSTALLATION.....");
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        const { data, error } = await database
          .from("users")
          .select("slack_installation_store")
          .eq("slack_id", installQuery.enterpriseId);
        if (error) throw error;
        return data[0].slack_installation_store;
      }
      if (installQuery.teamId !== undefined) {
        const { data, error } = await database
          .from("users")
          .select("slack_installation_store")
          .eq("slack_id", installQuery.teamId);
        if (error) throw error;
        return data[0].slack_installation_store;
      }
      throw new Error("Failed fetching installation.");
    },
    deleteInstallation: async (installQuery, logger) => {
      logger.info("DELETING SLACK INSTALLATION.....");
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        const { data, error } = await database
          .from("users")
          .delete()
          .eq("slack_id", installQuery.enterpriseId);
        if (error) throw error;
        return data;
      }
      if (installQuery.teamId !== undefined) {
        const { data, error } = await database
          .from("users")
          .delete()
          .eq("slack_id", installQuery.teamId);
        if (error) throw error;
        return data;
      }
      throw new Error("Failed to delete installation.");
    }
  },
  installerOptions: {
    directInstall: true,
    callbackOptions: {
      failure: (error, _installation, _req, res) => {
        if (error.code === "23505") {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          const pageBody = `
          <div>
            <img alt="Commerce Layer Logo" height="50" width="50" src="https://data.commercelayer.app/assets/logos/glyph/black/commercelayer_glyph_black.svg" />
            <br /><br />
            <h2>Oops, Something Went Wrong!</h2>
            <p>Commerce Layer Bot 🤖 is already installed in this Slack workspace.</p>
            <p>You can go ahead and start using the existing installation.</p>
            <br />
            <hr />
            <p>Please try again or contact the app owner (reason: ${error.code}).</p>
          </div>
          `;

          const html = serveHtml(pageBody);
          res.end(html);
        }
      }
    }
  },
  customRoutes: [
    {
      path: "/",
      method: ["GET"],
      handler: (_req, res) => {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        const pageBody = `
        <div>
          <img alt="Commerce Layer Logo" height="50" width="50" src="https://data.commercelayer.app/assets/logos/glyph/black/commercelayer_glyph_black.svg" />
          <br /><br />
          <h2>Commerce Layer Slackbot 🤖</h2>
          <p>The Commerce Layer slackbot for orders and returns summaries.</p>
          <hr />
          <br />
          <p>Kindly click the button below to install the app and read 
            <a href="https://github.com/commercelayer/examples/tree/main/solutions/commercelayer-slackbot#readme" target="_blank" rel="noopener noreferrer">
              the documentation</a>.
          </p>
          <a href="/slack/install" target="_blank" rel="noopener noreferrer">
            <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
          </a>
        </div>
          `;

        const html = serveHtml(pageBody);
        res.end(html);
      }
    }
  ]
});

let slackId: string;

// Listen to the app_home_opened event (App Home Tab).
app.event("app_home_opened", async ({ client, logger, context, payload }) => {
  slackId = context.teamId || context.enterpriseId;
  const { data, error } = await database
    .from("users")
    .select("slack_installation_store, cl_app_credentials")
    .eq("slack_id", slackId);
  if (error) throw error;
  const userId = payload.user;
  const adminUserId = data[0].slack_installation_store.user.id;
  const isClAuth = data[0].cl_app_credentials !== null;

  try {
    await client.views.publish({
      user_id: userId,
      view: {
        type: "home",
        blocks:
          userId === adminUserId
            ? [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Welcome, <@${userId}> :wave:*!`
                  }
                },
                {
                  type: "image",
                  image_url: "https://data.commercelayer.app/assets/images/banners/violet-half.jpg",
                  alt_text: "Commerce Layer banner image."
                },
                {
                  type: "divider"
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `To get started, you need to connect your organization by providing some app credentials.`
                  },
                  accessory: {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: isClAuth ? "Update App Credentials" : "Configure App Credentials",
                      emoji: true
                    },
                    style: "primary",
                    value: "cl_connect_org",
                    action_id: "action_cl_connect_org"
                  }
                },
                {
                  type: "divider"
                },
                isClAuth
                  ? {
                      type: "section",
                      text: {
                        type: "mrkdwn",
                        text: `You have now created an access token for your organization that will expire at: ${"`"}${new Date(
                          data[0].cl_app_credentials.accessToken.expiresAt
                        ).toLocaleString()}${"`"}. You can now use the slash commands in any channel to get orders and returns summaries 🚀.`
                      }
                    }
                  : {
                      type: "section",
                      text: {
                        type: "plain_text",
                        text: " "
                      }
                    }
              ]
            : [
                {
                  type: "image",
                  image_url: "https://data.commercelayer.app/assets/images/banners/violet-half.jpg",
                  alt_text: "Commerce Layer banner image."
                },
                {
                  type: "divider"
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `To get started, ask the workspace admin to configure this app if they haven't yet :wink:.`
                  }
                }
              ]
      }
    });
  } catch (error) {
    logger.error(error);
  }
});

// Listen to the trigger button (Configuration Form Modal).
app.action(
  { action_id: "action_cl_connect_org", type: "block_actions" },
  async ({ ack, body, client, logger }) => {
    await ack();

    const { data, error } = await database
      .from("users")
      .select("slack_installation_store, cl_app_credentials")
      .eq("slack_id", slackId);
    if (error) throw error;

    const isClAuth = data[0].cl_app_credentials !== null;
    const config = isClAuth ? await initConfig(slackId) : null;

    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "callback_cl_modal_view",
          title: {
            type: "plain_text",
            text: "Configure CL Slackbot"
          },
          submit: {
            type: "plain_text",
            text: "Submit",
            emoji: true
          },
          close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
          },
          blocks: [
            {
              type: "input",
              block_id: "block_cl_client_id",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_client_id",
                initial_value: isClAuth ? config.clientIdApp : ""
              },
              label: {
                type: "plain_text",
                text: "Integration Client ID"
              },
              hint: {
                type: "plain_text",
                text: "This is needed for API requests."
              }
            },
            {
              type: "input",
              block_id: "block_cl_client_secret",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_client_secret",
                initial_value: ""
              },
              label: {
                type: "plain_text",
                text: "Integration Client Secret"
              },
              hint: {
                type: "plain_text",
                text: "This is needed for API requests (will not be stored)."
              }
            },
            {
              type: "input",
              block_id: "block_cl_int_client_id",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_checkout_client_id",
                initial_value: isClAuth ? config.clientIdCheckout : ""
              },
              label: {
                type: "plain_text",
                text: "Sales Channel Client ID"
              },
              hint: {
                type: "plain_text",
                text: "This is needed for the hosted-checkout."
              }
            },
            {
              type: "input",
              block_id: "block_cl_endpoint",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_endpoint",
                initial_value: isClAuth ? config.baseEndpoint : ""
              },
              label: {
                type: "plain_text",
                text: "Base Endpoint"
              }
            }
          ]
        }
      });
    } catch (error) {
      logger.error(error);
    }
  }
);

// Handle the view_submission request (Configuration Form Data).
app.view("callback_cl_modal_view", async ({ ack, body, view, client, logger }) => {
  await ack();

  const user = body.user.id;
  const slackId = body.team.id || body.enterprise.id;

  const clientIdApp = view["state"]["values"]["block_cl_client_id"]["action_cl_client_id"].value;
  const clientSecret =
    view["state"]["values"]["block_cl_client_secret"]["action_cl_client_secret"].value;
  const endpoint = view["state"]["values"]["block_cl_endpoint"]["action_cl_endpoint"].value;
  const slug = getSlug(endpoint);
  const clientIdCheckout =
    view["state"]["values"]["block_cl_int_client_id"]["action_cl_checkout_client_id"].value;

  await authentication("client_credentials", {
    clientId: clientIdApp,
    clientSecret,
    slug
  })
    .then(async (res) => {
      const tokenInfo = await getTokenInfo(res.accessToken);
      const organizationMode = tokenInfo.isTest ? "test" : "live";
      if (res.error !== "invalid_client") {
        await database
          .from("users")
          .update({
            cl_app_credentials: {
              mode: organizationMode,
              endpoint,
              clientIdApp,
              clientIdCheckout,
              accessToken: {
                token: res.accessToken,
                createdAt: res.createdAt,
                expiresAt: res.expires,
                expiresIn: res.expiresIn,
                scope: res.scope,
                tokenType: res.tokenType
              }
            }
          })
          .eq("slack_id", slackId);

        await client.chat.postMessage({
          channel: user,
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: ":white_check_mark: Your organization app credentials was submitted successfully."
              }
            },
            {
              type: "image",
              image_url: "https://media2.giphy.com/media/Gjoz5izVy7gSA/giphy.gif",
              alt_text: "GIF of a man dancing happily"
            }
          ]
        });
      } else {
        await client.chat.postMessage({
          channel: user,
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: ":warning: There was an error with your organization app credentials submission."
              }
            },
            {
              type: "section",
              text: {
                type: "plain_text",
                text: "Please check the provided values and try again."
              }
            },
            {
              type: "image",
              image_url: "https://media3.giphy.com/media/snEeOh54kCFxe/giphy.gif",
              alt_text: "GIF of two sad men"
            }
          ]
        });
      }
    })
    .catch(async (err) => {
      logger.error(err);
    });
});

// Listen to the app_uninstalled and tokens_revoked events.
// Temporal delete implementation until Bolt supports this natively.
// See: https://github.com/slackapi/bolt-js/issues/1203.
app.event("app_uninstalled" || "tokens_revoked", async ({ logger, context }) => {
  logger.info("DELETING SLACK INSTALLATION.....");
  const { data, error } = await database
    .from("users")
    .delete()
    .eq("slack_id", context.teamId || context.enterpriseId);
  if (error) logger.error("Failed to delete installation.", error);
  return data;
});

// Respond with 200 OK to buttons with links.
// Reason: all Slack buttons dispatch a request.
app.action("view_customer", ({ ack }) => ack());
app.action("check_order", ({ ack }) => ack());
app.action("view_return", ({ ack }) => ack());

// Acknowledge and respond to all requests to the /cl slash command.
app.command("/cl", async ({ command, client, ack, say }) => {
  await ack();

  const slackId = command.team_id || command.enterprise_id;
  const config = await initConfig(slackId);

  if (command.text.startsWith("order ")) {
    const resourceType = getOrderById(command.text.replace("order ", ""), config);
    getOrderResource(resourceType, command, client, say);
  } else if (command.text === "orders:p last" || command.text === "orders:last") {
    const resourceType = getLastOrder("placed", config);
    getOrderResource(resourceType, command, client, say);
  } else if (command.text === "orders:a last") {
    const resourceType = getLastOrder("approved", config);
    getOrderResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("return ")) {
    const resourceType = getReturnById(command.text.replace("return ", ""), config);
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "returns:r last" || command.text === "returns:last") {
    const resourceType = getLastReturn("requested", config);
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "returns:a last") {
    const resourceType = getLastReturn("approved", config);
    getReturnResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("orders:today ")) {
    const resourceType = getTodaysOrder(command.text.replace("orders:today ", ""), config);
    getOrdersCountResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("returns:today")) {
    const resourceType = getTodaysReturn(config);
    getReturnsCountResource(resourceType, command, client, say);
  }
});

// Fetch all orders summary requests.
const getOrderResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });

  const resource = await resourceType;

  if (resource.error && resource.error === 401) {
    const errorMessage = expiredTokenError();
    await renderError(say, userInput, errorMessage);
  } else if (resource.error && resource.error === 404) {
    const errorMessage = notFoundError("Order");
    await renderError(say, userInput, errorMessage);
  } else {
    const clOrder = resource.orders;
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:shopping_trolley: Order ${"`"}${clOrder.id}${"`"} from the *${
              clOrder.market.name
            }* market has a total amount of *${clOrder.formatted_subtotal_amount}* and was ${
              clOrder.placed_at !== null ? "placed" : "created"
            } on <!date^${formatTimestamp(
              clOrder.placed_at !== null ? clOrder.placed_at : clOrder.created_at
            )}^{date_long} at {time}|${
              clOrder.placed_at !== null ? clOrder.placed_at : clOrder.created_at
            }>. Here's a quick summary of the resource:`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Customer email:*\n${
                clOrder.customer !== null ? clOrder.customer.email : "null"
              }`
            },
            {
              type: "mrkdwn",
              text: `*Customer ID:*\n<https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/customers/${
                clOrder.customer !== null ? clOrder.customer.id : "null"
              }|${clOrder.customer !== null ? clOrder.customer.id : "null"}>`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Order number:*\n${"`"}${clOrder.number}${"`"}`
            },
            {
              type: "mrkdwn",
              text: `*Order status:*\n${"`"}${clOrder.status}${"`"}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Payment status:*\n${"`"}${clOrder.payment_status}${"`"}`
            },
            {
              type: "mrkdwn",
              text: `*Fulfillment status:*\n${"`"}${clOrder.fulfillment_status}${"`"}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Shipping address:*\n${
                clOrder.shipping_address !== null
                  ? clOrder.shipping_address.full_name +
                    ", " +
                    clOrder.shipping_address.full_address
                  : "null"
              }.`
            },
            {
              type: "mrkdwn",
              text: `*Billing address:*\n${
                clOrder.billing_address !== null
                  ? clOrder.billing_address.full_name + ", " + clOrder.billing_address.full_address
                  : "null"
              }.`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Payment method:*\n${
                clOrder.payment_method !== null ? clOrder.payment_method.name : "null"
              }`
            },
            {
              type: "mrkdwn",
              text: `*Shipment number(s):*\n${
                clOrder.shipments.length > 0
                  ? clOrder.shipments.map((shipment) => {
                      // todo: remove , from last element in the array
                      if (clOrder.shipments.length > 1) {
                        return `<https://dashboard.commercelayer.io/${
                          resource.organizationMode === "live" ? "live" : "test"
                        }/${resource.organizationSlug}/resources/shipments/${shipment.id}|${
                          shipment.number
                        }>, `;
                      } else {
                        return `<https://dashboard.commercelayer.io/${
                          resource.organizationMode === "live" ? "live" : "test"
                        }/${resource.organizationSlug}/resources/shipments/${shipment.id}|${
                          shipment.number
                        }>`;
                      }
                    })
                  : "null"
              }`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            clOrder.status === "pending"
              ? {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Checkout Order",
                    emoji: true
                  },
                  style: "primary",
                  value: "checkout_order",
                  url: `https://${resource.organizationSlug}.commercelayer.app/checkout/${clOrder.id}?accessToken=${resource.checkoutAccessToken}`,
                  action_id: "check_order"
                }
              : {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "View Order",
                    emoji: true
                  },
                  style: "primary",
                  value: "view_order",
                  url: `https://dashboard.commercelayer.io/${
                    resource.organizationMode === "live" ? "live" : "test"
                  }/${resource.organizationSlug}/resources/orders/${clOrder.id}`,
                  action_id: "check_order"
                },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Customer",
                emoji: true
              },
              value: "view_customer",
              url: `https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/customers/${
                clOrder.customer !== null ? clOrder.customer.id : "null"
              }`,
              action_id: "view_customer"
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: `${triggerUser.user.profile.image_72}`,
              alt_text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              }'s avatar`
            },
            {
              type: "mrkdwn",
              text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              } has triggered this request.`
            }
          ]
        }
      ],
      text: `:shopping_trolley: Order ${"`"}${clOrder.id}${"`"} from the *${
        clOrder.market.name
      }* market has a total amount of *${clOrder.formatted_subtotal_amount}* and was ${
        clOrder.placed_at !== null ? "placed" : "created"
      } on <!date^${formatTimestamp(
        clOrder.placed_at !== null ? clOrder.placed_at : clOrder.created_at
      )}^{date_long} at {time}|${
        clOrder.placed_at !== null ? clOrder.placed_at : clOrder.created_at
      }>.`
    });
  }
};

// Fetch all returns summary requests.
const getReturnResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });

  const resource = await resourceType;

  if (resource.error && resource.error === 401) {
    const errorMessage = expiredTokenError();
    await renderError(say, userInput, errorMessage);
  } else if (resource.error && resource.error === 404) {
    const errorMessage = notFoundError("Return");
    await renderError(say, userInput, errorMessage);
  } else {
    const clReturn = resource.returns;
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:shopping_trolley: Return ${"`"}${clReturn.id}${"`"} from the *${
              clReturn.order.country_code
            }* market includes *${clReturn.skus_count}* line items, is to be shipped to the *${
              clReturn.stock_location.name
            }*, and was created on <!date^${formatTimestamp(
              clReturn.created_at
            )}^{date_long} at {time}|${
              clReturn.created_at
            }>. Here's a quick summary of the resource:`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Customer email:*\n${
                clReturn.customer !== null ? clReturn.customer.email : "null"
              }`
            },
            {
              type: "mrkdwn",
              text: `*Customer ID:*\n<https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/customers${
                clReturn.customer !== null ? clReturn.customer.id : "null"
              }|${clReturn.customer !== null ? clReturn.customer.id : "null"}>`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Return number:*\n${"`"}${clReturn.number}${"`"}`
            },
            {
              type: "mrkdwn",
              text: `*Return status:*\n${"`"}${clReturn.status}${"`"}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Origin address:*\n${
                clReturn.origin_address !== null
                  ? clReturn.origin_address.full_name + ", " + clReturn.origin_address.full_address
                  : "null"
              }.`
            },
            {
              type: "mrkdwn",
              text: `*Destination address:*\n${
                clReturn.destination_address !== null
                  ? clReturn.destination_address.full_name +
                    ", " +
                    clReturn.destination_address.full_address
                  : "null"
              }.`
            }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Return",
                emoji: true
              },
              style: "primary",
              value: "view_return",
              url: `https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/returns/${clReturn.id}`,
              action_id: "view_return"
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Customer",
                emoji: true
              },
              value: "view_customer",
              url: `https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/customers/${
                clReturn.customer !== null ? clReturn.customer.id : "null"
              }`,
              action_id: "view_customer"
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: `${triggerUser.user.profile.image_72}`,
              alt_text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              }'s avatar`
            },
            {
              type: "mrkdwn",
              text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              } has triggered this request.`
            }
          ]
        }
      ],
      text: `:shopping_trolley: Return ${"`"}${clReturn.id}${"`"} from the *${
        clReturn.order.country_code
      }* market includes *${clReturn.skus_count}* line items, is to be shipped to the *${
        clReturn.stock_location.name
      }*, and was created on <!date^${formatTimestamp(clReturn.created_at)}^{date_long} at {time}|${
        clReturn.created_at
      }>.`
    });
  }
};

// Fetch all orders count requests.
const getOrdersCountResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });

  const resource = await resourceType;

  if (resource.error && resource.error === 401) {
    const errorMessage = expiredTokenError();
    await renderError(say, userInput, errorMessage);
  } else {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Total number of placed orders (all markets):*\n${resource.allOrdersCount}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Total number of placed orders (${resource.currencyName}):*\n${resource.allOrdersByMarketCount}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Total revenue:*\n${resource.revenueCount}`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: `${triggerUser.user.profile.image_72}`,
              alt_text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              }'s avatar`
            },
            {
              type: "mrkdwn",
              text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              } has triggered this request.`
            }
          ]
        }
      ],
      text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:\n *Total number of placed orders (all markets):*\n${resource.recordCount} \n *Total number of placed orders (${resource.currencyName}):*\n${resource.allOrdersByMarketCount} \n *Total revenue:*\n${resource.recordCount}`
    });
  }
};

// Fetch all returns count requests.
const getReturnsCountResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });

  const resource = await resourceType;

  if (resource.error && resource.error === 401) {
    const errorMessage = expiredTokenError();
    await renderError(say, userInput, errorMessage);
  } else {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Total number of requested returns:*\n${resource.recordCount}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "image",
              image_url: `${triggerUser.user.profile.image_72}`,
              alt_text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              }'s avatar`
            },
            {
              type: "mrkdwn",
              text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              } has triggered this request.`
            }
          ]
        }
      ],
      text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:\n *Total number of requested returns:*\n${resource.recordCount}`
    });
  }
};

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("\x1b[93m ⚡️ Bolt app is running! \x1b[0m");
})();
