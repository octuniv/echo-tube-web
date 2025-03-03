import Posts from "@/components/posts/AllPosts";
import { FetchAllPosts } from "@/lib/actions";
import { PostDto, VideoCardInfo } from "@/lib/definition";

const PostsPage = async () => {
  let videoData: VideoCardInfo[] = [];

  const posts = await FetchAllPosts();
  videoData = posts.map((post: PostDto) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, updatedAt, ...data } = post;
    return data satisfies VideoCardInfo;
  });

  const sortedVideoData = videoData.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return <Posts sortedVideos={sortedVideoData} />;
};

export default PostsPage;
