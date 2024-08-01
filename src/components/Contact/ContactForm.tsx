import React from "react";

const ContactForm = () => {
  return (
    <>
      <form className="flex flex-col gap-3 w-[60%] mx-auto">
        <div className="flex gap-4">
          <input
            className="w-full h-12 rounded-lg px-2 focus:outline-none bg-grey-900 text-lg text-grey-200"
            type="text"
            placeholder="Name"
          />
          <input
            className="w-full h-12 rounded-lg px-2 focus:outline-none bg-grey-900 text-lg text-grey-200"
            type="email"
            placeholder="Email"
          />
        </div>
        <div>
          <textarea
            className="w-full h-24 rounded-lg p-2 focus:outline-none bg-grey-900 text-lg text-grey-200"
            placeholder="Message"></textarea>
        </div>
        <button
          type="submit"
          className="bg-[#6d6d6d] text-[#f6f6f6] px-3 py-2.5 rounded-xl hover:bg-[#888888] text-xl font-semibold tracking-wide">
          Send
        </button>
      </form>
    </>
  );
};

export default ContactForm;
