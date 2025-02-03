export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : // biome-ignore lint/complexity/noBannedTypes: allow extending Function
    T extends Function
    ? T
    : T extends object
      ? DeepReadonlyObject<T>
      : T;

type DeepReadonlyArray<T> = object & ReadonlyArray<DeepReadonly<T>>;

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
