import React from "react";

import Testimonial from "@/components/Testimonial/Testimonial";
import Wrapper from "@/components/Wrapper";
import Contact from "@/components/Contact/Contact";
import MoreAboutMe from "@/components/MoreAboutMe/MoreAboutMe";
import TechStack from "@/components/TechStack/TechStack";
import Introduction from "@/components/Introduction/Introduction";
import Projects from "@/components/Projects/Projects";

const page = () => {
  return (
    <>
      <div>
        <Wrapper>
          <Introduction />
          <Projects />
          <Testimonial />
          <TechStack />
          <MoreAboutMe />
          <Contact />
        </Wrapper>
        {/* About me ✔️*/}
        {/* Projects ✔️*/}
        {/* Tech stack ✔️*/}
        {/* Contact Me ✔️*/}
        {/* my offerings */}
        {/* more about me writting competetive programming things ✔️ */}
        {/* add achievements awqards in about me✔️ */}
        {/* Hackathon experience✔️ */}
        {/* links to my socials ✔️ */}
      </div>
    </>
  );
};

export default page;
