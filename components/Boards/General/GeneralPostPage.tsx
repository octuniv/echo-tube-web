import { PostResponse } from "@/lib/definition";
import PostLayout from "../Shared/PostLayout";

// components/Boards/General/GeneralPostPage.tsx

interface GeneralPostPageProps {
  post: PostResponse; // URL에서 전달되는 게시물 ID
  isEditable: boolean;
  boardSlug: string;
}

export default function GeneralPostPage({
  post,
  isEditable,
  boardSlug,
}: GeneralPostPageProps) {
  return (
    <PostLayout post={post} isEditable={isEditable} boardSlug={boardSlug}>
      <></>
    </PostLayout>
  );
}
