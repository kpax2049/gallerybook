import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertISOtoReadableDate(updatedAt: Date) {
  const date = new Date(updatedAt);
  const result = date.toLocaleString('en-GB', {
    // you can use undefined as first argument
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return result;
}

export function enrich<P extends IntrinsicAttributes & P>(
  WrappedComponent: React.ComponentType<P>
) {
  function Enrich(props: P) {
    return <WrappedComponent {...props} />;
  }
  return Enrich;
}
