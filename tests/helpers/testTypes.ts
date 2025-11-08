// tRPC response wrapper for tests
export type TrpcResponse<T> = {
  result?: { data?: T };
  error?: { message?: string; code?: string };
}