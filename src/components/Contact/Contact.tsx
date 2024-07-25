import React from "react";
import ContactForm from "./ContactForm";

const Contact = () => {
  return (
    <>
      <div className="py-20">
        <div className="text-6xl text-white font-Anton pb-10">Contact Me</div>
        <div className="bg-purple backdrop-blur-2xl relative  ">
          {/* <div className="absolute radial-gradient-purple top-0 left-40 w-[40rem] h-[20rem]"></div> */}
          <div className="text-white text-3xl text-balance ">
            If you have a project Idea or you want to talk about development in
            general, Don&apos;t be shy to hit me up
          </div>
          <ContactForm />
          <div>Or you can dm me on ony of my socials</div>
          <div className="flex justify-center space-x-4">
            <a href="https://twitter.com">
              <img src="/images/twitter.png" alt="twitter" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
