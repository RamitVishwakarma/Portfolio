import React from "react";

const MoreAboutMe = () => {
  return (
    <>
      <div className="py-20">
        <div className="text-6xl font-Anton text-white text-center pb-10">
          More About Me
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex gap-10">
            <div className="flex flex-col w-[60%]">
              <h2 className="text-4xl text-red py-4">Techie Me</h2>
              <p className="text-base text-balance text-white/75">
                I like to code solutions to problems I feel worthy of solving I
                spend most of my time looking through open source codebases,
                contributing to these codebases and sometimes building my
                projects I like to participate in competitive programming I have
                2 stars on CodeChef to show for it and I am looking to make it
                to 5 stars by the end of my final year. I certainly developed
                interest in web 3.0 and blockchain and I am starting to learn
                the intrecasies of this technology too. I love to participate in
                hackathons building solutions to problem in a limited times
                gives a thrilling experience. I love building scalable products
                and deploying it on the web. I love seeing my code come to life
                and I love the feeling of being a part of something bigger than
                myself I am a Fullstack developer with a strong focus on the
                frontend and I am always looking to learn new things. To me the
                best part of being a developer is the ability to create
                something out of nothing I am always looking for new
                opportunities to work on projects that will make a difference in
                the world. Seeing a project make money is the best and essential
                part of all It shows that a change has been made by that project
                and being a part of that change is the best feeling in the
                world.
              </p>
            </div>
            <div className="relative w-[50%] flex gap-2 items-center">
              <div className="bg-purple w-[25rem] h-[25rem] z-[4] absolute right-0"></div>
              <div className="bg-green w-[25rem] h-[25rem] z-[5] absolute right-14"></div>
              <div className="bg-red w-[25rem] h-[25rem] z-[4] absolute left-0"></div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl text-red py-4">Casual Me</h2>
            <p className="text-lg font-medium text-balance text-white/75 w-[56%] leading-9 tracking-wider">
              Well I only have two parts of me and both of them want to be
              competitive In my free time, I love to play FPS games to challenge
              my reaction time and the strategic part of my brain Growing up I
              loved playing football and I still do, I love the the feeling of
              scoring a goal and the feeling of winning a match When I feel
              lethargic I watch web series, and movies and listen to audiobooks.
              I have a deep interest in finances and like to read about how the
              world of finance works. At last, I try to touch some grass too
              once a week to keep myself from being a complete nerd
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MoreAboutMe;
