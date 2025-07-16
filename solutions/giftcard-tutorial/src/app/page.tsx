"use client";
import { addGiftCardToOrder, createGiftCard, getCheckoutLink, GiftCardData } from "@/lib/commercelayer";

import { useState } from "react";
import Image from "next/image";
import { useCommerceLayer } from "@commercelayer/react-components";

const presetAmounts = [25, 50, 100, 200];
const designs = [
  { id: 1, name: "Confetti", image: "https://res.cloudinary.com/dvbqso85l/image/upload/v1751384150/confetti_u885gd.png" },
  { id: 2, name: "Birthday", image: "https://res.cloudinary.com/dvbqso85l/image/upload/v1751384150/classic_jqxrys.png" },
  { id: 3, name: "Classic", image: "https://res.cloudinary.com/dvbqso85l/image/upload/v1751384150/birthday_qtj5zm.png" },
];

export default function BuyGiftCardPage() {
  const [amount, setAmount] = useState<number | "">(presetAmounts[0]);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedDesign, setSelectedDesign] = useState(designs[0].id);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");

  const {sdkClient} = useCommerceLayer()

  const handleAmountChange = (val: number | "") => {
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setAmount("");
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const giftCardData: GiftCardData = {
        amount: (amount === "" ? parseFloat(customAmount) : amount) , 
        design: designs.find(d => d.id === selectedDesign)?.image || "",
        recipientEmail: recipient,
        message: message,
      }

      const giftCard = await createGiftCard(giftCardData, sdkClient())
      const order = await addGiftCardToOrder(giftCard.id, sdkClient())
      const checkoutLink = await getCheckoutLink(order)
      
      window.location.href = checkoutLink;

    } catch (error) {
      console.error("Error creating gift card:", error);
      alert("An error occurred while processing your purchase. Please try again.");
      return;
    }
    
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Buy a Gift Card</h1>
      <form onSubmit={handlePurchase} className="space-y-6">
        {/* Amount selection */}
        <div>
          <label className="block font-medium mb-2">Amount</label>
          <div className="flex gap-2 mb-2">
            {presetAmounts.map((amt) => (
              <button
                type="button"
                key={amt}
                className={`px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  amount === amt
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800"
                }`}
                onClick={() => handleAmountChange(amt)}
                aria-pressed={amount === amt}
              >
                ${amt}
              </button>
            ))}
            <input
              type="number"
              min="1"
              placeholder="Custom"
              className="w-24 px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={amount === "" ? customAmount : ""}
              onChange={handleCustomAmount}
              aria-label="Custom amount"
            />
          </div>
        </div>
        {/* Design selection */}
        <div>
          <label className="block font-medium mb-2">Design</label>
          <div className="flex gap-4">
            {designs.map((design) => (
              <button
                type="button"
                key={design.id}
                className={`rounded-lg border-2 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedDesign === design.id
                    ? "border-blue-600"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedDesign(design.id)}
                aria-pressed={selectedDesign === design.id}
              >
                <Image
                  src={design.image}
                  alt={design.name}
                  width={80}
                  height={56}
                  className="w-20 h-14 object-cover rounded mb-1"
                />
                <div className="text-xs text-center">{design.name}</div>
              </button>
            ))}
          </div>
        </div>
        {/* Recipient */}
        <div>
          <label
            htmlFor="recipient"
            className="block font-medium mb-2"
          >
            Recipient
          </label>
          <input
            id="recipient"
            type="text"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Recipient's name or email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
        </div>
        {/* Message */}
        <div>
          <label htmlFor="message" className="block font-medium mb-2">
            Message
          </label>
          <textarea
            id="message"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a personal message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        {/* Purchase button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Purchase
        </button>
      </form>
    </main>
  );
}
