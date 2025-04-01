"use client";

import { EditPost } from "@/lib/actions";
import { useActionState } from "react";
import { PostState as ErrorState, PostDto } from "@/lib/definition";
import EditPostForm from "../PostForm";

interface EditPostFageProps {
  postId: number;
  boardSlug: string;
  post: PostDto;
}

const EditPostPage: React.FC<EditPostFageProps> = ({
  postId,
  boardSlug,
  post,
}) => {
  const initialState: ErrorState = { message: "", errors: {} };
  const EditPostWithId = EditPost.bind(null, postId, boardSlug);
  const [state, formAction] = useActionState(EditPostWithId, initialState);
  return (
    <EditPostForm
      state={state}
      formAction={formAction}
      post={post}
      boardSlug={boardSlug}
    />
  );
};

export default EditPostPage;
