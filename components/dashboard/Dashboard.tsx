"use client";

// app/page.js
import { useState, useEffect } from "react";

const currentUser = {
  nickname: "개발자_준호",
  posts: 8,
  comments: 27,
};

interface postType {
  id: number;
  title: string;
  views: number;
  author: string;
  time: string;
  hot: boolean;
}
export default function Dashboard() {
  const [posts, setPosts] = useState<postType[]>([]);
  const [highlightPost, setHighlightPost] = useState<postType>();

  useEffect(() => {
    // 실제 개발 시 API 연동
    const samplePosts = [
      {
        id: 1,
        title: "React Hooks 질문",
        views: 87,
        author: "홍길동",
        time: "3시간 전",
        hot: false,
      },
      {
        id: 2,
        title: "[공유] VSCode 단축키",
        views: 215,
        author: "관리자",
        time: "6시간 전",
        hot: true,
      },
      {
        id: 3,
        title: "Next.js 15 업데이트",
        views: 132,
        author: "dev_jun",
        time: "1일 전",
        hot: false,
      },
    ];

    setPosts(samplePosts.filter((p) => !p.hot));
    setHighlightPost(samplePosts.find((p) => p.hot));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-6 mb-10 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">
            안녕하세요, {currentUser.nickname}님!
          </h1>
          <p className="text-lg">오늘도 즐거운 개발 되세요 🚀</p>
        </div>
      </div>

      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* 방문자 통계 */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform">
          <h3 className="text-blue-600 text-lg font-semibold border-b-2 border-blue-600 pb-2 mb-4">
            오늘의 활동
          </h3>
          <div className="text-gray-700 text-xl font-bold">
            방문자 수 <span className="text-blue-600">127</span>
          </div>
        </div>

        {/* 인기 게시물 */}
        {highlightPost && (
          <div className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform">
            <h3 className="text-blue-600 text-lg font-semibold border-b-2 border-blue-600 pb-2 mb-4">
              🔥 인기 게시물
            </h3>
            <a
              href="#"
              className="text-blue-600 font-medium block hover:text-blue-700"
            >
              {highlightPost.title}
            </a>
            <div className="text-gray-500 text-sm mt-2">
              조회수 {highlightPost.views} · {highlightPost.time}
            </div>
          </div>
        )}

        {/* 사용자 활동 */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform">
          <h3 className="text-blue-600 text-lg font-semibold border-b-2 border-blue-600 pb-2 mb-4">
            나의 활동
          </h3>
          <div className="flex justify-between text-gray-700">
            <span>작성글</span>
            <strong className="text-blue-600">{currentUser.posts}</strong>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>댓글</span>
            <strong className="text-blue-600">{currentUser.comments}</strong>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 최근 게시물 리스트 */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600">최근 게시물</h2>
              <button className="text-blue-600 text-sm hover:underline">
                모두 보기
              </button>
            </div>

            <ul className="space-y-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <a href="#" className="text-blue-600 font-medium block mb-1">
                    {post.title}
                  </a>
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>by {post.author}</span>
                    <span>{post.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="col-span-1 space-y-6 hidden lg:block">
          <div className="bg-white p-4 rounded-2xl shadow-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">빠른 메뉴</h3>
            <button className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform">
              새 글 작성
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 active:scale-95 transition-transform">
              인기 태그 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
