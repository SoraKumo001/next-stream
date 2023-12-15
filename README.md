# next-stream

## description

Suspense and useId and SSR-Streaming samples

## operation check

<https://next-stream-self.vercel.app/>

## Sample code

- src/hooks/useStreamLoader.tsx

```tsx
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const isServer = typeof window === "undefined";

type StreamProperty<T, R> = {
  promise?: Promise<T>;
  isLoaded?: boolean;
  value?: T;
  param: R | undefined;
  loader: (param?: R) => Promise<T>;
};

const StreamLoader = <T, R>({
  id,
  property,
  loader,
  onLoad,
  onPending,
}: {
  id: string;
  loader: (param?: R) => Promise<T>;
  property: StreamProperty<T, R>;
  onLoad: (value: T) => void;
  onPending: (isPending: boolean) => void;
}) => {
  const [value, setValue] = useState<T>(() => {
    if (!isServer) {
      const node = document.getElementById(id);
      if (node) {
        property.isLoaded = true;
        property.value = JSON.parse(node.innerHTML);
        return property.value as T;
      }
    }
    return property.value as T;
  });

  if (!property.promise && !property.isLoaded) {
    property.promise = loader(property.param).then((v) => {
      property.promise = undefined;
      property.isLoaded = true;
      property.value = v;
      setValue(v);
      return v;
    });
  }

  if (isServer && property.promise) throw property.promise;

  useEffect(() => {
    if (property.isLoaded) onLoad?.(value);
    onPending(false);
    property.value = undefined;
  }, [onLoad, onPending, property, value]);
  return property.value === undefined ? null : (
    <script
      id={id}
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(property.value),
      }}
    />
  );
};

type ResultType<T> = {
  isPending: boolean;
  SSRStream: () => JSX.Element;
  value: T;
};

export const useStreamLoader: {
  <T, R>(loader: (param: R) => Promise<T>, defaultParam: R): ResultType<T> & {
    dispatch: (param: R) => void;
  };
  <T>(loader: () => Promise<T>): ResultType<T> & { dispatch: () => void };
} = <T, R>(loader: (param?: R) => Promise<T>, defaultParam?: R) => {
  const id = useId();
  const [value, setValue] = useState<T>();
  const [isPending, setPending] = useState(true);
  const property = useRef<StreamProperty<T, R>>({
    param: defaultParam,
    loader,
  }).current;
  const SSRStream = useCallback(() => {
    return (
      <Suspense>
        <StreamLoader
          id={id}
          loader={property.loader}
          onPending={setPending}
          onLoad={setValue}
          property={property}
        />
      </Suspense>
    );
  }, [id, property]);
  const dispatch = useCallback(
    (param?: R) => {
      property.isLoaded = false;
      property.promise = undefined;
      if (param) property.param = param;
      setPending(true);
    },
    [property]
  );
  return { value, isPending, SSRStream, dispatch };
};
```

- src/app/page.tsx

```tsx
"use client";
import { useStreamLoader } from "../hooks/useStreamLoader";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Page = () => {
  const { value, SSRStream, isPending, dispatch } = useStreamLoader(
    async () => {
      // Streaming confirmation wait
      await sleep(2000);
      return fetch(`https://www.jma.go.jp/bosai/common/const/area.json`).then(
        async (r) => r.json()
      );
    }
  );

  return (
    <>
      <div>
        Source code:
        <a href="https://github.com/SoraKumo001/next-stream">
          https://github.com/SoraKumo001/next-stream
        </a>
      </div>
      <button onClick={() => dispatch()}>Reload</button>
      <div>
        {isPending ? (
          "Loading"
        ) : (
          <pre>{JSON.stringify(value, undefined, "  ")}</pre>
        )}
      </div>
      {/* Components for streaming */}
      <SSRStream />
    </>
  );
};

export default Page;

export const runtime = "edge";
```
