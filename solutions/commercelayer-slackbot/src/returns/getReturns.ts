import { generateDate } from "../utils/parseDate";
import { ConfigOptions } from "../types/config";

const getReturnById = async (id: string, config: ConfigOptions) => {
  const { cl, organizationSlug, organizationMode } = config;

  try {
    const returns = await cl.returns.retrieve(id, {
      include: ["order", "stock_location", "customer", "origin_address", "destination_address"]
    });

    return { returns, organizationMode, organizationSlug };
  } catch (error) {
    return { error: error.status };
  }
};

const getLastReturn = async (status: string, config: ConfigOptions) => {
  const { cl, organizationSlug, organizationMode } = config;

  try {
    const returns = (
      await cl.returns.list({
        include: ["order", "stock_location", "customer", "origin_address", "destination_address"],
        filters: { status_eq: `${status}` },
        sort: status === "requested" ? { created_at: "desc" } : { approved_at: "desc" }
      })
    ).first();

    return { returns, organizationSlug, organizationMode };
  } catch (error) {
    return { error: error.status };
  }
};

const getTodaysReturn = async (config: ConfigOptions) => {
  const { cl, organizationSlug } = config;

  try {
    const returns = await cl.returns.list({
      filters: {
        status_eq: "requested",
        created_at_gteq: `${generateDate("today")}}`,
        created_at_lt: `${generateDate("next")}}`
      }
    });
    const recordCount = returns.meta.recordCount;

    return { returns, recordCount, organizationSlug };
  } catch (error) {
    return { error: error.status };
  }
};

export { getReturnById, getLastReturn, getTodaysReturn };
