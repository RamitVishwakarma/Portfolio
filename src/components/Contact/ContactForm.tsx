import React from "react";

const ContactForm = () => {
  return (
    <>
      <form className="flex flex-col gap-4">
        <div className="flex gap-4">
          <input
            className="w-full h-12 rounded-lg px-2 focus:outline-none"
            type="text"
            placeholder="Name"
          />
          <input
            className="w-full h-12 rounded-lg px-2 focus:outline-none"
            type="email"
            placeholder="Email"
          />
        </div>
        <div>
          <textarea
            className="w-full h-24 rounded-lg p-2 focus:outline-none"
            placeholder="Message"></textarea>
        </div>
        <button type="submit" className="bg-blue p-3 rounded-xl">
          Submit
        </button>
      </form>
    </>
  );
};

export default ContactForm;
