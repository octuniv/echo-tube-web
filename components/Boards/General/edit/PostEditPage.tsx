"use client";

import { EditPost } from "@/lib/actions";
import { useActionState } from "react";
import { PostState as ErrorState, PostDto } from "@/lib/definition";
import PostEditForm from "../../Shared/PostEditor";

interface PostEditPageProps {
  postId: number;
  boardSlug: string;
  post: PostDto;
}

const PostEditPage: React.FC<PostEditPageProps> = ({
  postId,
  boardSlug,
  post,
}) => {
  const initialState: ErrorState = { message: "", errors: {} };
  const EditPostWithId = EditPost.bind(null, postId, boardSlug);
  const [state, formAction] = useActionState(EditPostWithId, initialState);
  return (
    <PostEditForm
      state={state}
      formAction={formAction}
      post={post}
      boardSlug={boardSlug}
    />
  );
};

export default PostEditPage;
