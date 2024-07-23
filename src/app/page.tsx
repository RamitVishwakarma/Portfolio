import React from "react";
import SectionOne from "../components/SectionOne/SectionOne";
import SectionTwo from "@/components/SectionTwo/SectionTwo";
import SectionThree from "@/components/SectionThree/SectionThree";
import Wrapper from "@/components/Wrapper";
import SectionFour from "@/components/SectionFour/SectionFour";

const page = () => {
  return (
    <>
      <div>
        <Wrapper>
          <SectionOne />
          <SectionTwo />
          <SectionThree />
          <SectionFour />
          {/* About me */}
          {/* Projects */}
          {/* Tech stack */}
          {/* Contact Me */}
          {/* more about me writting competetive programming things */}
          {/* add achievements awqards in about me */}
          {/* Hackathon experience */}
          {/* links to my socials */}
          {/* my offerings */}
        </Wrapper>
      </div>
    </>
  );
};

export default page;
