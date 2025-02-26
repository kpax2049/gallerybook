import React from 'react';
export function enrich<P extends IntrinsicAttributes & P>(
  WrappedComponent: React.ComponentType<P>
) {
  function Enrich(props: P) {
    return <WrappedComponent {...props} />;
  }
  return Enrich;
}
