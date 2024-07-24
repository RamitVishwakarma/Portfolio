import React from "react";
import Introduction from "../components/SectionOne/Introduction";
import Testimonial from "@/components/Testimonial/Testimonial";
import Wrapper from "@/components/Wrapper";
import Contact from "@/components/Contact/Contact";
import MoreAboutMe from "@/components/MoreAboutMe/MoreAboutMe";
import Projects from "@/components/SectionTwo/Projects";
import TechStack from "@/components/TechStack/TechStack";

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
