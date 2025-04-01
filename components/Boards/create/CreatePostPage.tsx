"use client";

import { CreatePost } from "@/lib/actions";
import { useActionState } from "react";
import { PostState as ErrorState } from "@/lib/definition";
import CreatePostForm from "../PostForm";

const CreatePostPage: React.FC<{ boardSlug: string }> = ({
  boardSlug,
}: {
  boardSlug: string;
}) => {
  const initialState: ErrorState = { message: "", errors: {} };
  const CreatePostWithSlug = CreatePost.bind(null, boardSlug);
  const [state, formAction] = useActionState(CreatePostWithSlug, initialState);
  return (
    <CreatePostForm
      state={state}
      formAction={formAction}
      boardSlug={boardSlug}
    />
  );
};

export default CreatePostPage;
