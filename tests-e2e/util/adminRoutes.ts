type AdminFeature = {
  key: string;
  routes: string[];
};

const ADMIN_BASE_PATH = "/admin";

// 기본 URL 템플릿 정의
const adminFeatures: AdminFeature[] = [
  {
    key: "users",
    routes: ["", "/:id", "/edit/:id", "/create"],
  },
  {
    key: "categories",
    routes: ["", "/:id", "/edit/:id", "/create"],
  },
  {
    key: "boards",
    routes: ["", "/:id", "/edit/:id", "/create"],
  },
];

/**
 * 관리자 URL 생성 함수
 * @param id 기본 ID (기본값: '1')
 * @returns 모든 관리자 URL 배열
 */
export function generateAdminUrls(id: string = "1"): string[] {
  const urls: string[] = [];

  adminFeatures.forEach(({ key, routes }) => {
    routes.forEach((route) => {
      let path = `${ADMIN_BASE_PATH}/${key}${route}`;
      if (route.includes("/:id")) {
        path = path.replace("/:id", `/${id}`);
      }
      urls.push(path);
    });
  });

  return urls;
}
