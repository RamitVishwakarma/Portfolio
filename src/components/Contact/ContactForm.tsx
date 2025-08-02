"use client";
import { sendEmail } from "@/app/ServerActions/SendEmail";
import React, { useState } from "react";

interface ValidationErrors {
  name?: string;
  email?: string;
  message?: string;
}

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return "Name can only contain letters and spaces";
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    if (email.length > 100) {
      return "Email must be less than 100 characters";
    }
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message.trim()) {
      return "Message is required";
    }
    if (message.trim().length < 10) {
      return "Message must be at least 10 characters long";
    }
    if (message.trim().length > 1000) {
      return "Message must be less than 1000 characters";
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const messageError = validateMessage(message);

    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (messageError) newErrors.message = messageError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Clear error when user starts typing
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    // Clear error when user starts typing
    if (errors.message) {
      setErrors((prev) => ({ ...prev, message: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResponseMessage("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await sendEmail({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (response.success) {
        setResponseMessage(
          "Message sent successfully! I'll get back to you soon."
        );
        // Clear form on success
        setName("");
        setEmail("");
        setMessage("");
        setErrors({});
      } else {
        setResponseMessage("Failed to send message. Please try again later.");
      }
    } catch (error) {
      setResponseMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 md:w-[60%] mx-auto">
        <div className="flex gap-4">
          <div className="w-full">
            <input
              onChange={handleNameChange}
              value={name}
              className={`w-full h-12 font-semibold rounded-lg px-2 focus:outline-none bg-grey-900 text-lg text-grey-200 ${
                errors.name
                  ? "border-2 border-red"
                  : "focus:border-2 focus:border-blue-500"
              }`}
              type="text"
              placeholder="Name"
              maxLength={50}
            />
            {errors.name && (
              <p className="text-red text-sm mt-1">{errors.name}</p>
            )}
          </div>
          <div className="w-full">
            <input
              onChange={handleEmailChange}
              value={email}
              className={`w-full h-12 font-semibold rounded-lg px-2 focus:outline-none bg-grey-900 text-lg text-grey-200 ${
                errors.email
                  ? "border-2 border-red"
                  : "focus:border-2 focus:border-blue-500"
              }`}
              placeholder="Email"
              maxLength={100}
            />
            {errors.email && (
              <p className="text-red text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>
        <div>
          <textarea
            onChange={handleMessageChange}
            value={message}
            className={`w-full h-24 font-medium rounded-lg p-2 focus:outline-none bg-grey-900 text-lg text-grey-200 resize-none ${
              errors.message
                ? "border-2 border-red"
                : "focus:border-2 focus:border-blue-500"
            }`}
            placeholder="Message"
            maxLength={1000}
          />
          {errors.message && (
            <p className="text-red text-sm mt-1">{errors.message}</p>
          )}
          <div className="text-right text-sm text-grey-400 mt-1">
            {message.length}/1000
          </div>
        </div>
        <button
          type="submit"
          className={`px-3 py-2.5 rounded-xl text-xl font-semibold tracking-wide transition-colors bg-[#6d6d6d] text-[#f6f6f6] hover:bg-[#888888] 
          `}>
          {isSubmitting ? "Sending..." : "Send"}
        </button>
        {responseMessage && (
          <p
            className={`text-center font-medium ${
              responseMessage.includes("successfully")
                ? "text-green"
                : "text-red"
            }`}>
            {responseMessage}
          </p>
        )}
      </form>
    </>
  );
};

export default ContactForm;
