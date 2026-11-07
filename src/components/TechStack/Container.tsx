import Image from "next/image";
import { dataInterface } from "./data";
import Build from "../Swarm/Build";

// Each card is drawn by the cursor named after it, when there is one.
const owners: Record<string, string> = {
  Figma: "Figma",
  "Next.js": "Next.js",
  "React.js": "React",
  Typescript: "TypeScript",
  Tailwindcss: "Tailwind",
  "Node.js": "Node",
  "Express.js": "Express",
  PostgreSQL: "Postgres",
  MongoDB: "MongoDB",
  Prisma: "Prisma",
  Git: "Git",
  Docker: "Docker",
  AWS: "AWS",
};

const Container = ({ data }: { data: dataInterface[] }) => {
  return (
    <>
      {data.map((data, index) => (
        <Build
          key={index}
          caption={`drawing ${data.title}`}
          owner={owners[data.title]}
          className="group bg-black p-4 relative rounded-xl overflow-hidden border border-purple/25 hover:border-purple/45 hover:scale-110 ">
          <div className="absolute top-0 -inset-3/4 h-full w-1/2 z-1 block transform -skew-x-12 bg-gradient-to-r from-black to-white opacity-40 group-hover:animate-shine" />
          <div className="flex gap-4 items-center">
            <Image
              width={64}
              height={64}
              className={`rounded-xl border w-16 h-16 border-white/15 object-contain ${data.classname} z-10 relative`}
              src={data.image}
              alt={data.title}
            />
            <div className="flex flex-col gap z-10 relative">
              <Build
                kind="text"
                pack
                owner={owners[data.title]}
                className="text-white/75 text-xl">
                {data.title}
              </Build>
              <Build kind="text" pack className="text-white/50 text-mg">
                {data.description}
              </Build>
            </div>
          </div>
        </Build>
      ))}
    </>
  );
};

export default Container;
