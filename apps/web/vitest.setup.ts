import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals を無効にしているため、Testing Library の自動クリーンアップは働かない。
// テストごとに DOM を明示的に破棄する。
afterEach(cleanup);
