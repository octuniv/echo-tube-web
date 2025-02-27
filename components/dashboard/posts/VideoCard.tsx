import { VideoCardInfo } from "@/lib/definition";

export default function VideoCard({
  video,
}: Readonly<{ video: VideoCardInfo }>) {
  const { title, nickName: author, createdAt: date, videoUrl: link } = video;
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-600">작성자: {author}</p>
      <p className="text-gray-500 text-sm">작성일: {date}</p>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline mt-2 block"
        >
          {link}
        </a>
      )}
    </div>
  );
}
