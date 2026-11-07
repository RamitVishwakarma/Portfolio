import React from "react";
import ContactForm from "./ContactForm";
import Socials from "./Socials";
import Build from "../Swarm/Build";

const Contact = () => {
  return (
    <>
      <div className="pt-20">
        <Build
          as="h2"
          kind="text"
          className="text-6xl text-white font-Anton pb-10 text-center CONTACTSECTION">
          Contact Me
        </Build>
        <div className=" ">
          <Build
            as="h3"
            kind="text"
            className="text-white text-4xl max-md:text-3xl font-light text-center py-10">
            Got some queries? Feel free to reach out
          </Build>
          <ContactForm />

          <Build
            kind="text"
            className="text-white text-3xl font-light text-center pt-8 pb-6">
            <span className="py-3 font-normal">OR</span>
            <br /> You can ping me on my socials
          </Build>
          <Socials />
        </div>
        <div className="text-white text-center text-sm flex items-center gap-4 justify-center pt-10 flex-col-reverse">
          <Build kind="text" className="text-md">
            &copy; 2024 - All Rights reserved
          </Build>
          <Build kind="text" className="text-xl">
            Made with <span className="text-red ">♥</span>
          </Build>
        </div>
      </div>
    </>
  );
};

export default Contact;
