import React from "react";
import ContactForm from "./ContactForm";
import Socials from "./Socials";

const Contact = () => {
  return (
    <>
      <div className="pt-20">
        <h2 className="text-6xl text-white font-Anton pb-10 text-center CONTACTSECTION">
          Contact Me
        </h2>
        <div className=" ">
          <div className="">
            {/* <div className="absolute radial-gradient-purple top-0 left-40 w-[40rem] h-[20rem]"></div> */}
            {/* <div className="text-white text-4xl font-medium text-center py-10">
              No need to be Shy Just drop a HI
            </div> */}
            <h3 className="text-white text-4xl font-light text-center py-10">
              Got some queries? Feel free to reach out
            </h3>
            <ContactForm />
          </div>
          <div className="text-white text-3xl font-light text-center pt-8 pb-6">
            <span className="py-3 font-normal">OR</span>
            <br /> You can ping me on my socials
          </div>
          <Socials />
        </div>
        <div className="text-white text-center text-sm flex items-center gap-4 justify-center pt-10 flex-col-reverse">
          <div className="text-md">&copy; 2024 - All Rights reserved</div>
          <div className="text-xl">
            Made with <span className="text-red ">♥</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
