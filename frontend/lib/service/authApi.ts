import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { RootState } from '@/lib/store';
import { logOut, setCredentials } from '../features/authSlice';

// --- Type Definitions ---
export interface User {
  id: string | number;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5000',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.accessToken;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();

  const url = typeof args === 'string' ? args : args.url;
  const isAuthEndpoint =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh');

  let token = (api.getState() as RootState).auth?.accessToken;

  // 1. Proactive Refresh: If token is missing in Redux on reload, fetch token FIRST
  if (!token && !isAuthEndpoint) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const refreshData = refreshResult.data as AuthResponse;
          if (refreshData.accessToken) {
            api.dispatch(
              setCredentials({ accessToken: refreshData.accessToken })
            );
          }
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
    }
  }

  // 2. Execute original request
  let result = await rawBaseQuery(args, api, extraOptions);

  // 3. Fallback Reactive Refresh: Handle token expiration during session (401 mid-use)
  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const refreshData = refreshResult.data as AuthResponse;
          if (refreshData.accessToken) {
            api.dispatch(
              setCredentials({ accessToken: refreshData.accessToken })
            );
            // Retry original query with newly fetched token
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logOut());
            api.dispatch(authApi.util.resetApiState());
          }
        } else {
          api.dispatch(logOut());
          api.dispatch(authApi.util.resetApiState());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// --- RTK Query API Slice ---
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    checkUser: builder.query<AuthResponse, void>({
      query: () => '/auth/checkuser',
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logOut());
          dispatch(authApi.util.resetApiState());
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useCheckUserQuery,
  useLazyCheckUserQuery,
  useLogoutMutation,
} = authApi;