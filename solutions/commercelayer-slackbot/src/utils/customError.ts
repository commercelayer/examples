export const renderError = async (say, userInput, errorMessage) => {
  await say({
    blocks: [
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url:
              "https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png",
            alt_text: "Yellow notification warning icon"
          },
          {
            type: "mrkdwn",
            text: `Command \`${userInput.command} ${userInput.text}\` failed with error:`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\n\n\`\`\`${JSON.stringify(errorMessage, null, 2)}\`\`\``
        }
      }
    ],
    text: errorMessage
  });
};

export const expiredTokenError = () => {
  return {
    name: "ApiError",
    type: "response",
    errors: [
      {
        title: "Invalid token",
        detail:
          "The access token you provided is invalid (has expired). Please update your app credentials in the home tab to generate a new access token.",
        code: "INVALID_TOKEN",
        status: "401"
      }
    ]
  };
};

export const notFoundError = (title: string) => {
  return {
    name: "ApiError",
    type: "response",
    errors: [
      {
        title: `${title} resource not found`,
        detail: `The requested resource was not found. Please double-check the resource ID or that one or more ${title.toLowerCase()}'s with the requested status exists.`,
        code: "RECORD_NOT_FOUND",
        status: "404"
      }
    ]
  };
};
