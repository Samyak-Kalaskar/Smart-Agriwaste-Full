// src/redux/api/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "../store"

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl:"https://smartagriwasteapi.azurewebsites.net/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token

      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
      }

      return headers
    },
  }),
  tagTypes: ["Order", "Profile", "Negotiation", "Notification", "Waste"],
  endpoints: () => ({}),
})

