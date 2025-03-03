"use client";

import { CreatePost } from "@/lib/actions";
import { useActionState } from "react";
import { PostState as ErrorState } from "@/lib/definition";
import CreatePostForm from "./CreatePostForm";

const CreatePostPage: React.FC = () => {
  const initialState: ErrorState = { message: "", errors: {} };
  const [state, formAction] = useActionState(CreatePost, initialState);
  return <CreatePostForm state={state} formAction={formAction} />;
};

export default CreatePostPage;
