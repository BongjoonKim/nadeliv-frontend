// App.tsx
import React, {useEffect} from 'react';
import styled from "styled-components";
import RoutersTree from "./RoutersTree";
import {ChakraProvider, defaultSystem} from "@chakra-ui/react";
import {useRecoilValue} from "recoil";
import recoil from "./stores/recoil";
import posthog from 'posthog-js'
import { PostHogProvider} from 'posthog-js/react'
import {AuthProvider} from "./appConfig/AuthProvider";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Toaster} from "./common/elements/toaster";
import {ConfirmDialogHost} from "./common/elements/ConfirmDialog";
import {initAnalytics} from "./utils/analytics";

// PostHog 초기화 — 키가 없으면 no-op (utils/analytics.ts 참조)
initAnalytics();

// QueryClient를 컴포넌트 밖에서 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChakraProvider value={defaultSystem}>
            <StyledApp className={"app"}>
              <RoutersTree/>
            </StyledApp>
            <Toaster/>
            <ConfirmDialogHost/>
          </ChakraProvider>
        </AuthProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export default App;

const StyledApp = styled.div`
    width: 100%;
    height: 100%;
`;