import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Điều hành chiến dịch | Thành đoàn Hải Phòng",
    template: "%s | Điều hành chiến dịch",
  },
  description:
    "Hệ thống tự chấm, thẩm định, giải trình và chốt kết quả chiến dịch của Thành đoàn Hải Phòng.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Điều hành chiến dịch",
    description: "Quy trình tự chấm, thẩm định và chốt kết quả có truy vết.",
    locale: "vi_VN",
    type: "website",
    images: [{ url: "/social-preview.png", width: 1728, height: 896 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/social-preview.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8fa",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
