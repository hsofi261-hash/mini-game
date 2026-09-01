import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface AuthState {
  accessToken: string | null;
}

const initialState: AuthState = {
  accessToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken?: string }>
    ) => {
      const { accessToken } = action.payload;
      if (accessToken) {
        state.accessToken = accessToken;
      }
    },
    logOut: (state) => {
      state.accessToken = null;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

// Selectors
export const selectCurrentToken = (state: RootState) => state.auth.accessToken;

export default authSlice.reducer;