import { createSerwistRoute } from "@serwist/turbopack";

const serwistRoute = createSerwistRoute({
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
});

export const generateStaticParams = serwistRoute.generateStaticParams;
export const GET = serwistRoute.GET as any;
