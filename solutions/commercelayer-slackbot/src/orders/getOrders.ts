import { getCheckoutToken } from "../utils/getToken";
import { generateDate } from "../utils/parseDate";
import { ConfigOptions } from "../types/config";

const getOrderById = async (id: string, config: ConfigOptions) => {
  const { cl, organizationSlug, organizationMode } = config;

  try {
    const orders = await cl.orders.retrieve(id, {
      include: [
        "customer",
        "market",
        "shipments",
        "shipping_address",
        "billing_address",
        "payment_method"
      ]
    });

    const checkoutAccessToken = await getCheckoutToken(config, orders.market.number);

    return { orders, organizationSlug, organizationMode, checkoutAccessToken };
  } catch (error) {
    return { error: error.status };
  }
};

const getLastOrder = async (status: string, config: ConfigOptions) => {
  const { cl, organizationSlug, organizationMode } = config;

  try {
    const orders = (
      await cl.orders.list({
        include: [
          "customer",
          "market",
          "shipments",
          "shipping_address",
          "billing_address",
          "payment_method"
        ],
        filters: { status_eq: `${status}` },
        sort: status === "placed" ? { placed_at: "desc" } : { approved_at: "desc" }
      })
    ).first();

    return { orders, organizationSlug, organizationMode };
  } catch (error) {
    return { error: error.status };
  }
};

const getTodaysOrder = async (currency: string, config: ConfigOptions) => {
  const { cl, organizationSlug } = config;

  try {
    const currencyName = currency.toUpperCase();

    const allOrders = await cl.orders.list({
      filters: {
        status_eq: "placed",
        placed_at_gteq: `${generateDate("today")}}`,
        placed_at_lt: `${generateDate("next")}}`
      }
    });
    const allOrdersCount = allOrders.meta.recordCount;

    const allOrdersByMarket = await cl.orders.list({
      filters: {
        currency_code_eq: `${currencyName}`,
        status_eq: "placed",
        placed_at_gteq: `${generateDate("today")}}`,
        placed_at_lt: `${generateDate("next")}}`
      }
    });
    const allOrdersByMarketCount = allOrdersByMarket.meta.recordCount;

    const revenue = allOrdersByMarket.reduce((acc, order) => {
      return acc + order.total_amount_cents;
    }, 0);

    let revenueCount;
    allOrdersByMarketCount !== 0
      ? (revenueCount = (revenue / 100).toLocaleString(
          `${allOrdersByMarket[0].language_code}-${allOrdersByMarket[0].country_code}`,
          {
            style: "currency",
            currency: `${allOrdersByMarket[0].currency_code}`
          }
        ))
      : (revenueCount = 0);

    return {
      allOrdersCount,
      allOrdersByMarketCount,
      revenueCount,
      currencyName,
      organizationSlug
    };
  } catch (error) {
    return { error: error.status };
  }
};

export { getOrderById, getLastOrder, getTodaysOrder };
