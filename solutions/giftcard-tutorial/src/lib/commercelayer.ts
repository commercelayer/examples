import { authenticate } from '@commercelayer/js-auth'
import { CommerceLayerClient } from '@commercelayer/sdk'

const CL_CLIENT_ID = process.env.NEXT_PUBLIC_CL_CLIENT_ID
const CL_ORG_SLUG = process.env.NEXT_PUBLIC_CL_ORG_SLUG
// Optional — falls back to the market this tutorial was written against.
const CL_MARKET_CODE = process.env.NEXT_PUBLIC_CL_MARKET_CODE || 'us'

if (!CL_CLIENT_ID || !CL_ORG_SLUG) {
  throw new Error('NEXT_PUBLIC_CL_CLIENT_ID or NEXT_PUBLIC_CL_ORG_SLUG is not defined in the environment variables')
}


export async function getValidToken() {
  const auth = await authenticate('client_credentials', {
    clientId: CL_CLIENT_ID!,
    scope: `market:code:${CL_MARKET_CODE}`,
  })

  return auth.accessToken
}

export interface GiftCardData {
    amount: number | string
    design: string
    recipientEmail: string
    message: string
}

export async function createGiftCard(data: GiftCardData, client: CommerceLayerClient|undefined) {
    if (!client) {
        throw new Error("CommerceLayer client is not defined");
    }
    return client.gift_cards.create({
        rechargeable: false,
        single_use: false,
        balance_cents: typeof data.amount === 'number' ? data.amount * 100 : parseFloat(data.amount) * 100,
        image_url: data.design,
        recipient_email: data.recipientEmail,
        metadata:{
            message: data.message
        }
    })
}

export async function addGiftCardToOrder(giftCard:string, client: CommerceLayerClient|undefined): Promise<string> {
    if (!client) {
        throw new Error("CommerceLayer client is not defined");
    }
    
    const order = await client.orders.create({})
    
    client.line_items.create({
        quantity: 1,
        item: client.gift_cards.relationship(giftCard),
        order: client.orders.relationship(order.id),
    })
    
    return order.id
}

export async function getCheckoutLink(orderId: string){
    return `https://${CL_ORG_SLUG}.commercelayer.app/checkout/${orderId}?accessToken=${await getValidToken()}`
}