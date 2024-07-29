import React from "react";
import ContactForm from "./ContactForm";
import Socials from "./Socials";
import SendButton from "./SendButton";

const Contact = () => {
  return (
    <>
      <div className="py-20">
        <div className="text-6xl text-white font-Anton pb-10">Contact Me</div>
        <div className=" ">
          {/* <div className="absolute radial-gradient-purple top-0 left-40 w-[40rem] h-[20rem]"></div> */}
          <div className="text-white text-4xl font-medium text-center py-10">
            No need to be shy
            <br />
            Just drop a hi
          </div>
          <ContactForm />
          <div className="text-white text-4xl font-medium text-center py-8">
            OR
            <br /> You can ping me on <br /> any of my socials
          </div>
          <Socials />
        </div>
      </div>
    </>
  );
};

export default Contact;
