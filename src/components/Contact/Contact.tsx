import React from "react";
import ContactForm from "./ContactForm";

const Contact = () => {
  return (
    <>
      <div className="bg-purple backdrop-blur-2xl relative  py-10">
        {/* <div className="absolute radial-gradient-purple top-0 left-40 w-[40rem] h-[20rem]"></div> */}
        <div className="text-white text-3xl text-balance ">
          If you have a project Idea or you want to talk about development in
          general, Don't be shy to hit me up
        </div>
        <ContactForm />
        <div>Or you can dm me on ony of my socials</div>
        <div className="flex justify-center space-x-4">
          <a href="https://twitter.com">
            <img src="/images/twitter.png" alt="twitter" />
          </a>
        </div>
      </div>
    </>
  );
};

export default Contact;
