export type ApiListResponse<T> = {
  items: T[];
  total: number;
};

export type ApiMutationResult<T> = {
  data: T;
  message?: string;
};

