const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const contentfulImport = require("contentful-import");

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
    console.log("Something went wrong.", error);
  });
