"use client";
import { sendEmail } from "@/app/ServerActions/SendEmail";
import React, { useState } from "react";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await sendEmail({ name, email, message });
    setResponseMessage(response.message);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-[60%] mx-auto">
        <div className="flex gap-4">
          <input
            onChange={handleNameChange}
            className="w-full h-12 font-semibold rounded-lg px-2 focus:outline-none bg-grey-900 text-lg text-grey-200"
            type="text"
            placeholder="Name"
          />
          <input
            onChange={handleEmailChange}
            className="w-full h-12 font-semibold rounded-lg px-2 focus:outline-none bg-grey-900 text-lg text-grey-200"
            type="email"
            placeholder="Email"
          />
        </div>
        <div>
          <textarea
            onChange={handleMessageChange}
            className="w-full h-24 font-medium rounded-lg p-2 focus:outline-none bg-grey-900 text-lg text-grey-200"
            placeholder="Message"></textarea>
        </div>
        <button
          type="submit"
          className="bg-[#6d6d6d] text-[#f6f6f6] px-3 py-2.5 rounded-xl hover:bg-[#888888] text-xl font-semibold tracking-wide">
          Send
        </button>
        {responseMessage && (
          <p className="text-green text-center">{responseMessage}</p>
        )}
      </form>
    </>
  );
};

export default ContactForm;
