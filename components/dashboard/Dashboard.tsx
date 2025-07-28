// components/dashboard/Dashboard.tsx
"use client";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  DashboardSummaryDto,
  PostResponse,
  UserAuthInfo,
} from "@/lib/definition";

interface DashboardProps {
  user: UserAuthInfo;
  data: DashboardSummaryDto;
}

export default function Dashboard({ user, data }: DashboardProps) {
  // 인기 게시물 중 가장 높은 hotScore를 가진 포스트 선택
  const highlightPost = useMemo(() => {
    if (data.popularPosts.length === 0) return null;
    return data.popularPosts.reduce(
      (prev, curr) => (curr.hotScore > prev.hotScore ? curr : prev),
      data.popularPosts[0]
    );
  }, [data.popularPosts]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { locale: ko });
  };

  // 게시물 주소
  const postAddress = (post: PostResponse) =>
    `/boards/${post.board.slug}/${post.id}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl p-6 mb-10 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">
            안녕하세요, {user.nickname}님!
          </h1>
          <p className="text-lg">오늘도 즐거운 하루 되세요 🚀</p>
        </div>
      </div>

      {/* 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* 방문자 통계 */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform">
          <h3 className="text-blue-600 text-lg font-semibold border-b-2 border-blue-600 pb-2 mb-4">
            오늘의 방문자
          </h3>
          <div
            className="text-gray-700 text-2xl font-bold"
            aria-label="visitorCount"
          >
            {data.visitors.toLocaleString()} 명
          </div>
        </div>

        {/* 인기 게시물 */}
        {highlightPost ? (
          <div className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform">
            <h3 className="text-blue-600 text-lg font-semibold border-b-2 border-blue-600 pb-2 mb-4">
              🔥 인기 게시물
            </h3>
            <a
              href={postAddress(highlightPost)}
              className="text-blue-600 font-medium block hover:text-blue-700"
            >
              {highlightPost.title}
            </a>
            <div className="text-gray-500 text-sm mt-2">
              조회수 {highlightPost.views} ·{" "}
              {formatDate(highlightPost.createdAt)}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-gray-500">인기 게시물이 없습니다</div>
          </div>
        )}

        {/* 공지사항 */}
        <div className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform">
          <h3 className="text-blue-600 text-lg font-semibold border-b-2 border-blue-600 pb-2 mb-4">
            📢 공지사항
          </h3>
          {data.noticesPosts.length > 0 ? (
            <ul className="space-y-2">
              {data.noticesPosts.map((notice) => (
                <li key={notice.id} aria-label={`noticePost : ${notice.id}`}>
                  <a
                    href={postAddress(notice)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {notice.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">현재 공지사항이 없습니다</div>
          )}
        </div>
      </div>

      {/* 최근 게시물 리스트 */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-600">최근 게시물</h2>
          {/* <button className="text-blue-600 text-sm hover:underline">
            모두 보기
          </button> */}
        </div>
        {data.recentPosts.length > 0 ? (
          <ul className="space-y-4">
            {data.recentPosts.map((post) => (
              <li
                key={post.id}
                className="p-4 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label={`recentPost : ${post.id}`}
              >
                <a
                  href={postAddress(post)}
                  className="text-blue-600 font-medium block mb-1"
                >
                  {post.title}
                </a>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>by {post.nickname}</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 py-4">최근 게시물이 없습니다</div>
        )}
      </div>
    </div>
  );
}
