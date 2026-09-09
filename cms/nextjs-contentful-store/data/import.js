/* eslint-disable no-console */

const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const contentfulImport = require("contentful-import");

const REQUIRED_ENV = ["NEXT_PUBLIC_CONTENTFUL_SPACE_ID", "CONTENTFUL_IMPORT_MANAGEMENT_TOKEN"];

const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy .env.local.example to .env.local and fill them in.");
  process.exit(1);
}

const options = {
  contentFile: "./data/contentful-seed.json",
  spaceId: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID,
  managementToken: process.env.CONTENTFUL_IMPORT_MANAGEMENT_TOKEN
};

contentfulImport(options)
  .then(() => {
    console.log("✅ Data imported successfully!");
  })
  .catch((error) => {
    console.error("❌ Something went wrong. The import did not complete.");

    // contentful-import bundles every failure into a single error carrying an
    // `errors` array; print those instead of the wrapper, which says nothing.
    if (Array.isArray(error?.errors) && error.errors.length) {
      console.error(`${error.errors.length} error(s) occurred:`);
      error.errors.forEach((entry) => {
        console.error(entry?.error ?? entry);
      });
    } else {
      console.error(error);
    }

    process.exit(1);
  });
