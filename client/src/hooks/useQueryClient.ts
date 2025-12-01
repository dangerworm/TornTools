import { createContext, useContext } from "react";
import { QueryClient } from "../lib/react-query";

export const QueryClientContext = createContext<QueryClient | null>(null);

export const useQueryClient = () => {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error("No QueryClient set, use QueryClientProvider");
  }
  return client;
};
