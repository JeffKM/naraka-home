"use client";

import { createContext } from "react";

// 넘김 연출용 복제본 안에서는 true — 복제본의 BookMeta가 스토어를 덮어쓰지 않게
export const BookCopyContext = createContext(false);
