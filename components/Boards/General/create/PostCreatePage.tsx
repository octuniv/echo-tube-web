"use client";

import { CreatePost } from "@/lib/action/postActions";
import { useActionState } from "react";
import { CreatePostInputState as ErrorState } from "@/lib/definition";
import PostCreateForm from "../../Shared/PostEditor";

const PostCreatePage: React.FC<{ boardSlug: string }> = ({
  boardSlug,
}: {
  boardSlug: string;
}) => {
  const initialState: ErrorState = { message: "", errors: {} };
  const CreatePostWithSlug = CreatePost.bind(null, boardSlug);
  const [state, formAction] = useActionState(CreatePostWithSlug, initialState);
  return (
    <PostCreateForm
      state={state}
      formAction={formAction}
      boardSlug={boardSlug}
    />
  );
};

export default PostCreatePage;
