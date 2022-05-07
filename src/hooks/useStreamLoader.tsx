import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const isServer = typeof window === "undefined";

type StreamProperty<T, R> = {
  promise?: Promise<T>;
  isLoaded?: boolean;
  value?: T;
  param: R;
};

const StreamLoader = <T, R>({
  id,
  property,
  loader,
  onLoad,
  onPending,
}: {
  id: string;
  loader: (param: R) => Promise<T>;
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
        return property.value;
      }
    }
    return property.value;
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
  SSRStream: JSX.Element;
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
  }).current;
  const SSRStream = useMemo(() => {
    return (
      <Suspense>
        <StreamLoader
          id={id}
          loader={loader}
          onPending={setPending}
          onLoad={setValue}
          property={property}
        />
      </Suspense>
    );
  }, [id, loader, property]);
  const dispatch = useCallback(
    (param?: R) => {
      property.isLoaded = false;
      property.promise = undefined;
      property.param = param;
      setPending(true);
    },
    [property]
  );
  return { value, isPending, SSRStream, dispatch };
};
