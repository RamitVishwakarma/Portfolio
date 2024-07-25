import Image from "next/image";
import { dataInterface } from "./data";

const Container = ({ data }: { data: dataInterface[] }) => {
  return (
    <>
      {data.map((data, index) => (
        <div
          key={index}
          className="group bg-black p-4 relative rounded-xl overflow-hidden border border-purple">
          <div className="absolute top-0 -inset-full h-full w-1/2 z-1 block transform -skew-x-12 bg-gradient-to-r from-black to-white opacity-40 group-hover:animate-shine" />
          <div className="flex gap-4 items-center">
            <Image
              width={64}
              height={64}
              className={`rounded-xl border w-16 h-16 border-white object-contain ${data.classname} z-10 relative`}
              src={data.image}
              alt={data.title}
            />
            <div className="flex flex-col gap z-10 relative">
              <div className="text-white/75 text-xl">{data.title}</div>
              <div className="text-white/50 text-mg">{data.description}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Container;
