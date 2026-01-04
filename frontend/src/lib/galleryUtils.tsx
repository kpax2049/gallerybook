import React from 'react';

export function enrich<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const Enrich = (props: P) => <WrappedComponent {...props} />;
  return Enrich;
}
