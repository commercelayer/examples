require("dotenv").config();
import { Client } from "twitter-api-sdk";

const client = new Client(process.env.TW_BEARER_TOKEN as string);
const clTwitterId = process.env.CL_TWITTER_ID as string;

// Get tweets and users that mentions the clTwitterId
async function getTweets(startTime: string, endTime: string) {
  const mentions = await client.tweets.usersIdMentions(clTwitterId, {
    start_time: startTime,
    end_time: endTime,
    max_results: 5,
    "tweet.fields": ["author_id", "id", "created_at", "text"],
    expansions: ["author_id"],
    "user.fields": ["id", "username", "name"]
  });

  const tweets = mentions.data || [];
  const users = mentions.includes?.users || [];
  return {tweets, users};
}

export default getTweets;