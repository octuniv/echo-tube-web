"use client";

import { EditPost } from "@/lib/actions";
import { useActionState } from "react";
import { PostState as ErrorState, PostDto } from "@/lib/definition";
import EditPostForm from "../PostForm";

interface EditPostFageProps {
  postId: number;
  post: PostDto;
}

const EditPostPage: React.FC<EditPostFageProps> = ({ postId, post }) => {
  const initialState: ErrorState = { message: "", errors: {} };
  const EditPostWithId = EditPost.bind(null, postId);
  const [state, formAction] = useActionState(EditPostWithId, initialState);
  return <EditPostForm state={state} formAction={formAction} post={post} />;
};

export default EditPostPage;
