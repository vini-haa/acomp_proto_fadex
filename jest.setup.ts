import "@testing-library/jest-dom";

// Mock do Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

// Mock do next-themes
jest.mock("next-themes", () => ({
  useTheme() {
    return {
      theme: "light",
      setTheme: jest.fn(),
    };
  },
}));
