import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/lib/store';

// --- Type Definitions ---
export interface GameRule {
  id: number;
  step: number;
  title: string;
  desc: string;
}

export interface LeaderboardEntry {
  id: number;
  rank: number;
  user: string;
  avatar?: string;
  wins: number;
  winRate?: string;
  score: number;
  badge?: string;
}

export interface Review {
  id: string;
  user: string;
  avatar?: string;
  rating: number;
  date?: string;
  comment?: string;
}

export interface Game {
  id: string;
  title: string;
  tagline?: string;
  description?: string;
  category: string;
  difficulty?: string;
  rating: number;
  totalReviews: number;
  plays: number;
  icon?: string;
  color?: string;
  onlinePlayers?: number;
  tips?: string[];
}

export interface GameDetail extends Game {
  GameRules?: GameRule[];
  LeaderboardEntries?: LeaderboardEntry[];
  Reviews?: Review[];
}

export interface GetGamesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetGamesResponse {
  success: boolean;
  data: Game[];
  pagination: {
    totalGames: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetGameDetailResponse {
  success: boolean;
  data: GameDetail;
}

// --- RTK Query Game API Slice ---
export const gameApi = createApi({
  reducerPath: 'gameApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.accessToken;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Games', 'GameDetail'],
  endpoints: (builder) => ({
    // GET /games?page=1&limit=9&search=snake
    getGames: builder.query<GetGamesResponse, GetGamesParams | void>({
      query: (params) => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 9;
        const search = params?.search ?? '';

        return {
          url: '/game',
          method: 'GET',
          params: { page, limit, search },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Games' as const, id })),
              { type: 'Games', id: 'LIST' },
            ]
          : [{ type: 'Games', id: 'LIST' }],
    }),

    // GET /games/:id
    getGameDetail: builder.query<GetGameDetailResponse, string>({
      query: (id) => `/game/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'GameDetail', id }],
    }),
  }),
});

export const {
  useGetGamesQuery,
  useLazyGetGamesQuery,
  useGetGameDetailQuery,
  useLazyGetGameDetailQuery,
} = gameApi;