import Cookies from "js-cookie";
import CommerceLayer from "@commercelayer/sdk";

const cl = CommerceLayer({
  organization: "<organization slug>",
  accessToken: `${Cookies.get("clIntegrationToken")}`,
});

const createSku = async () => {
  const newSku = await cl.skus.create({
    shipping_category: cl.shipping_categories.relationship("JNxyxFLOXw"), // assign the shipping_category relationship
    code: "HOODIEGR0001XLXX",
    name: "Grey Coding Hoodie",
    description: "A very beautiful and cozy unisex hoodie",
    reference: "HOODIEGR0001",
    weight: "500",
    unit_of_weight: "gr",
  });

  console.log(`SKU: ${newSku.id} created succefully`);
  console.log(createSku); // this will return the created resource object
};

const retrieveSku = async () => {
  console.log("fetch all SKUs", await cl.skus.list());

  console.log(
    "fetch a particular SKU by the SKU code",
    await cl.skus.list({
      filters: { code_eq: "5PANECAP000000FFFFFFXXXX" },
    })
  );

  console.log(
    "fetch all SKUs that contain a particular string",
    await cl.skus.list({ filters: { name_cont: "Hoodie" } })
  );

  console.log(
    "fetch all SKUs whose code start with a particular string",
    await cl.skus.list({ filters: { code_start: "HOODIE" } })
  );

  console.log(
    "fetch all SKUs whose code ends with a particular string",
    await cl.skus.list({ filters: { code_end: "XLXX" } })
  );

  console.log(
    "fetch all SKUs created between two specific dates",
    await cl.skus.list({
      filters: { created_at_gt: "2022-01-01", created_at_lt: "2022-04-01" },
    })
  );

  console.log(
    "fetch all SKUs and customize the pages",
    await cl.skus.list({ pageNumber: 1, pageSize: 20 })
  );

  console.log(
    "fetch all SKUs and sort by creation date in ascending order",
    await cl.skus.list({ sort: { created_at: "asc" } })
  );

  console.log(
    "fetch all SKUs and sort by creation date in descending order",
    await cl.skus.list({ sort: { created_at: "desc" } })
  );

  console.log(
    "fetch all SKUs and include their price associations",
    await cl.skus.list({ include: ["prices"] })
  );

  console.log(
    "fetch all SKUs and include their stock items associations",
    await cl.skus.list({ include: ["stock_items"] })
  );

  console.log(
    "fetch an SKU and return only specific fields",
    await cl.skus.list({ fields: { skus: ["name", "description", "weight"] } })
  );

  console.log(
    "fetch an SKU with an associated resource and return only specific fields",
    await cl.skus.list({
      include: ["prices"],
      fields: {
        prices: [
          "currency_code",
          "formatted_amount",
          "formatted_compare_at_amount",
        ],
      },
    })
  );
};

const updateSku = async () => {
  console.log(
    cl.skus.update({
      id: "BdplSqwDLb",
      name: "Grey Programming Hoodie",
      description: "Add a new description here",
      weight: "600",
    })
  );
};

const deleteSku = async () => {
  console.log(cl.skus.delete("BdplSqwDLb"));
};

// createSku();
// retrieveSku();
// updateSku();
// deleteSku();
