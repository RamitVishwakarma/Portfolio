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
          <main>
            <Introduction />
          </main>
          <Projects />
          <Testimonial />
          <TechStack />
          <MoreAboutMe />
          <Contact />
        </Wrapper>
      </div>
    </>
  );
};

export default page;
