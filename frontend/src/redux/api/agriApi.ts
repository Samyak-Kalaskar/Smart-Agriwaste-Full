import { TranslatedString } from "@/components/types/negotiation";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface RecommendationParams {
  product: string;
  moisture: "dry" | "semi_wet" | "wet";
  intendedUse: string;
  lang: "en" | "mr" | "hi";
}

interface recommendationResult {
  benefits: string;
  finalOutput: string;
  notes: string;
  process: string[];
}

export const agriApi = createApi({
  reducerPath: "agriApi",
  baseQuery: fetchBaseQuery({
    baseUrl:"https://smartagriwastedataset.lemonmoss-6d514309.centralindia.azurecontainerapps.io",
  }),
  tagTypes: ["Agri"],
  endpoints: (builder) => ({
    getRecommendations: builder.query<
      recommendationResult,
      RecommendationParams
    >({
      query: ({ product, moisture, intendedUse, lang }) => ({
        url: "/recommendation",
        params: {
          product,
          moisture,
          intendedUse,
          lang,
        },
      }),
    }),
  }),
});

export const { useLazyGetRecommendationsQuery } = agriApi;

